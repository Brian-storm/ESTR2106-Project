import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 导入路由相关
import './Home.css';

function Home() {
    const [venues, setVenues] = useState([]);
    const [favorites, setFavorites] = useState(new Set());
    const [userLocation, setUserLocation] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchQuery, setSearchQuery] = useState('');
    const [maxDistance, setMaxDistance] = useState(50);
    const [selectedDistrict, setSelectedDistrict] = useState('');

    // Favorite.js - 在组件中添加
    const [dataFetchTime, setDataFetchTime] = useState(null);

    useEffect(() => {
        // 从 localStorage 获取数据获取时间
        const savedTime = localStorage.getItem('dataFetchTime');
        if (savedTime) {
            setDataFetchTime(new Date(savedTime));
        }
    }, []);

    // 缺少的数据加载 useEffect
    useEffect(() => {
        const saved = localStorage.getItem('venues');
        
        if (saved) {
            const venueIds = JSON.parse(saved);
            console.log(`Loaded ${venueIds.length} venues from cache`);

            fetch("/api/locations?venueIds=" + venueIds.join(','))
                .then(response => response.json())
                .then(data => {
                    setVenues(data);
                    console.log("Fetched venues data from server based on cached IDs");
                }).catch((error) => {
                    console.error("Error fetching locations:", error);
                });
        } else {
            // 没有数据（第一次访问或缓存被清除了）
            console.log("No cached venues found, showing empty state");
        }
    }, []);
    
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                () => {
                    setUserLocation({ latitude: 22.3193, longitude: 114.1694 });
                }
            );
        } else {
            setUserLocation({ latitude: 22.3193, longitude: 114.1694 });
        }
    }, []);

    // 计算距离
    const calculateDistance = (venue) => {
        if (!userLocation || !venue.latitude || !venue.longitude) {
            return null; // 返回 null 而不是 "N/A" 便于比较
        }
        
        const lat1 = userLocation.latitude;
        const lon1 = userLocation.longitude;
        const lat2 = venue.latitude;
        const lon2 = venue.longitude;
        
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // 格式化距离显示
    const formatDistance = (distance) => {
        if (distance === null || distance === undefined) return "N/A";
        
        if (distance < 1) {
            return `${Math.round(distance * 1000)} m`;
        } else if (distance < 10) {
            return `${distance.toFixed(1)} km`;
        } else {
            return `${Math.round(distance)} km`;
        }
    };

    // 过滤函数 - 结合名称搜索和距离筛选
    // 更新过滤函数
    const filterVenues = (venues) => {
        // 确保venues是数组
        if (!Array.isArray(venues)) {
            console.warn('filterVenues received non-array:', venues);
            return [];
        }
        
        let filtered = venues;
        
        // 1. 名称搜索
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(venue => 
                venue.name?.toLowerCase().includes(query)
            );
        }
        
        // 2. 区域筛选
        if (selectedDistrict) {
            filtered = filtered.filter(venue => 
                venue.district === selectedDistrict + ' District'
            );
        }
        
        // 3. 距离筛选
        if (userLocation && maxDistance < 50) { // 如果最大距离小于50才筛选
            filtered = filtered.filter(venue => {
                const distance = calculateDistance(venue);
                return distance !== null && distance <= maxDistance;
            });
        }
        
        return filtered;
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortedAndFilteredVenues = () => {
        // 1. 先过滤
        let filteredVenues = filterVenues(venues);
        
        // 确保返回数组
        if (!Array.isArray(filteredVenues)) {
            console.warn('getSortedAndFilteredVenues: filteredVenues is not an array', filteredVenues);
            return [];
        }
        
        // 2. 再排序
        if (!sortConfig.key) return filteredVenues;
        
        return [...filteredVenues].sort((a, b) => {
            let aVal, bVal;
            
            if (sortConfig.key === 'distance') {
                aVal = calculateDistance(a) || Infinity;
                bVal = calculateDistance(b) || Infinity;
            } else if (sortConfig.key === 'events') {
                aVal = a.eventCount || 0;
                bVal = b.eventCount || 0;
            } else {
                aVal = a[sortConfig.key] || '';
                bVal = b[sortConfig.key] || '';
            }
            
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const sortedFilteredVenues = getSortedAndFilteredVenues();

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const res = await fetch('/api/favorites', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setFavorites(new Set(data.map(fav => fav.venueId)));
        } catch (error) {
            console.error('Failed to load favorites');
        }
    };

    const handleAddToFavorite = async (venueId) => {
        try {
            // 先更新本地状态（为了即时反馈）
            setFavorites(prev => {
                const newFavorites = new Set(prev);
                if (newFavorites.has(venueId)) {
                    newFavorites.delete(venueId);
                    console.log(`Removed ${venueId} from favorites (local)`);
                } else {
                    newFavorites.add(venueId);
                    console.log(`Added ${venueId} to favorites (local)`);
                }
                return newFavorites;
            });

            // 调用后端API
            const response = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ venueId })
            });

            if (!response.ok) {
                console.error('Failed to update favorites on server');
                // 如果服务器失败，回滚本地状态
                setFavorites(prev => {
                    const newFavorites = new Set(prev);
                    if (newFavorites.has(venueId)) {
                        newFavorites.delete(venueId);
                    } else {
                        newFavorites.add(venueId);
                    }
                    return newFavorites;
                });
            }

        } catch (error) {
            console.error('Error updating favorite:', error);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const handleClearDistrict = () => {
        setSelectedDistrict('');
    };

    const handleClearDistance = () => {
        setMaxDistance(50);
    };

    return (
        <div className="container-lg mt-4">
            {/* 搜索栏和距离筛选 */}
            <div className="mb-4">
                <div className="row">
                    {/* 名称搜索 - 调整高度 */}
                    <div className="col-4">
                        <div className="card border h-100">
                            <div className="card-body p-3 d-flex flex-column justify-content-center">
                                <h6 className="card-title mb-2">
                                    <i className="bi bi-search me-2"></i>
                                    Search Location
                                </h6>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Type location name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={handleClearSearch}
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 区域筛选 */}
                    <div className="col-4">
                        <div className="card border h-100">
                            <div className="card-body p-3 d-flex flex-column justify-content-center">
                                <h6 className="card-title mb-2">
                                    <i className="bi bi-geo me-2"></i>
                                    District
                                </h6>
                                <select 
                                    className="form-select"
                                    value={selectedDistrict}
                                    onChange={(e) => setSelectedDistrict(e.target.value)}
                                >
                                    <option value="">All Districts</option>
                                    <option value="Central and Western">Central & Western</option>
                                    <option value="Wan Chai">Wan Chai</option>
                                    <option value="Eastern">Eastern</option>
                                    <option value="Southern">Southern</option>
                                    <option value="Yau Tsim Mong">Yau Tsim Mong</option>
                                    <option value="Sham Shui Po">Sham Shui Po</option>
                                    <option value="Kowloon City">Kowloon City</option>
                                    <option value="Wong Tai Sin">Wong Tai Sin</option>
                                    <option value="Kwun Tong">Kwun Tong</option>
                                    <option value="Kwai Tsing">Kwai Tsing</option>
                                    <option value="Tsuen Wan">Tsuen Wan</option>
                                    <option value="Tuen Mun">Tuen Mun</option>
                                    <option value="Yuen Long">Yuen Long</option>
                                    <option value="North">North</option>
                                    <option value="Tai Po">Tai Po</option>
                                    <option value="Sha Tin">Sha Tin</option>
                                    <option value="Sai Kung">Sai Kung</option>
                                    <option value="Islands">Islands</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* 距离筛选 - 最大距离设为100km */}
                    <div className="col-4">
                        <div className="card border h-100">
                            <div className="card-body p-3 d-flex flex-column justify-content-center">
                                
                                {/* 距离显示 */}
                                <div className="text-center mb-2">
                                    <div>
                                        Distance {maxDistance < 1 ? `${Math.round(maxDistance * 1000)}(m)` : 
                                        maxDistance < 10 ? `${maxDistance.toFixed(1)}(km)` : 
                                        `${Math.round(maxDistance)}(km)`}
                                    </div>
                                </div>
                                
                                {/* 滑块 - 最大100km */}
                                <div className="d-flex align-items-center">
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="range"
                                            className="form-range"
                                            min="0.1"
                                            max="100"
                                            step="0.1"
                                            value={maxDistance < 0.1 ? 0.1 : maxDistance}
                                            onChange={(e) => {
                                                let value = parseFloat(e.target.value);
                                                if (value < 0.1) value = 0.1;
                                                if (value > 100) value = 100;
                                                setMaxDistance(value);
                                            }}
                                            style={{
                                                width: '100%',
                                                height: '10px',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="table-responsive">
                <table className="table table-striped table-hover m-0">
                    <thead className="table-header-clean">
                        <tr>
                            <th scope="col" className="text-center-cell">Venue ID</th>
                            <th scope="col" className="text-center-cell">
                                <button 
                                    className="btn btn-sm sort-btn-header sort-btn-location"
                                    onClick={() => handleSort('name')}
                                >
                                    <span>Location</span>
                                    <span className="sort-arrow">
                                        {sortConfig.key === 'name' ? 
                                            (sortConfig.direction === 'asc' ? '↑' : '↓') : 
                                            '⇅'}
                                    </span>
                                </button>
                            </th>
                            <th scope="col" className="text-center-cell">
                                <button 
                                    className="btn btn-sm sort-btn-header sort-btn-distance"
                                    onClick={() => handleSort('distance')}
                                >
                                    <span>Distance</span>
                                    <span className="sort-arrow">
                                        {sortConfig.key === 'distance' ? 
                                            (sortConfig.direction === 'asc' ? '↑' : '↓') : 
                                            '⇅'}
                                    </span>
                                </button>
                            </th>
                            <th scope="col" className="text-center-cell">
                                <button 
                                    className="btn btn-sm sort-btn-header sort-btn-events"
                                    onClick={() => handleSort('events')}
                                >
                                    <span>Number of Events</span>
                                    <span className="sort-arrow">
                                        {sortConfig.key === 'events' ? 
                                            (sortConfig.direction === 'asc' ? '↑' : '↓') : 
                                            '⇅'}
                                    </span>
                                </button>
                            </th>
                            <th scope="col" className="text-center-cell">Favorite</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedFilteredVenues.map((venue, index) => {
                            const distance = calculateDistance(venue);
                            return (
                                <tr key={venue.venueId || index}>
                                    <td>
                                        <div className="fw-bold">{venue.venueId}</div>
                                    </td>
                                    <td>
                                        <div className="fw-bold">
                                            {/* 添加可点击的链接到 View 页面 */}
                                            <Link 
                                                to={`/view/${venue.venueId}`}
                                                className="text-decoration-none text-primary"
                                                state={{ 
                                                    venueName: venue.name,
                                                    venueData: venue,
                                                    fromHome: true 
                                                }}
                                            >
                                                {venue.name}
                                            </Link>
                                        </div>
                                    </td>
                                    <td>
                                        <span> {formatDistance(distance)} </span>
                                    </td>
                                    <td>
                                        <span> {venue.eventCount || 0} </span>
                                    </td>
                                    <td className="text-center align-middle">
                                        <div className="d-flex justify-content-center align-items-center">
                                            <button
                                                className={`btn p-0 ${favorites.has(venue.venueId) ? 'text-danger' : 'text-primary'}`}
                                                onClick={() => handleAddToFavorite(venue.venueId)}
                                                title={favorites.has(venue.venueId) ? "Remove from favorites" : "Add to favorites"}
                                                style={{ 
                                                    fontSize: '1.5rem', 
                                                    border: 'none', 
                                                    background: 'none',
                                                    lineHeight: '1',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '40px',
                                                    height: '40px'
                                                }}
                                            >
                                                {favorites.has(venue.venueId) ? '❤️' : '🤍'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                
                {/* 没有搜索结果时显示 */}
                {sortedFilteredVenues.length === 0 && (
                    <div className="text-center py-4 text-muted">
                        <i className="bi bi-search display-6"></i>
                        <h5 className="mt-3">No venues found</h5>
                        <div className="mt-3">
                            {(searchQuery || selectedDistrict || maxDistance < 100) && (
                                <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => {
                                        handleClearSearch();
                                        handleClearDistrict();
                                        handleClearDistance();
                                    }}
                                >
                                    <i className="bi bi-arrow-clockwise me-2"></i>
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="d-flex justify-content-center align-items-center text-center text-muted small p-4">
                Last updated time : {dataFetchTime ? 
                    dataFetchTime.toLocaleString([], { 
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 
                    'Loading...'
                }
            </div>
        </div>
    );
}

export default Home;