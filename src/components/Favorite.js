import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Favorite.css';

function Favorite() {
    const [favorites, setFavorites] = useState([]);
    const [filteredFavorites, setFilteredFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 获取收藏
    useEffect(() => {
        fetch('/api/favorites')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setFavorites(data);
                    setFilteredFavorites(data);
                } else {
                    setError('Invalid data format');
                    setFavorites([]);
                    setFilteredFavorites([]);
                }
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setFavorites([]);
                setFilteredFavorites([]);
                setLoading(false);
            });
    }, []);

    // 搜索过滤
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredFavorites(favorites);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = favorites.filter(fav => 
                fav?.name?.toLowerCase().includes(query)
            );
            setFilteredFavorites(filtered);
        }
        setSortConfig({ key: null, direction: 'asc' });
        setCurrentPage(1);
    }, [searchQuery, favorites]);

    // 排序函数
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // 获取排序后的收藏列表
    const getSortedFavorites = () => {
        if (!sortConfig.key) return filteredFavorites;
        
        return [...filteredFavorites].sort((a, b) => {
            let aVal, bVal;
            
            if (sortConfig.key === 'location') {
                aVal = a?.name?.toLowerCase() || '';
                bVal = b?.name?.toLowerCase() || '';
            } else if (sortConfig.key === 'events') {
                aVal = a?.eventCount || a?.events?.length || 0;
                bVal = b?.eventCount || b?.events?.length || 0;
            }
            
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const sortedFavorites = getSortedFavorites();

    // 分页计算
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedFavorites.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedFavorites.length / itemsPerPage);

    // 分页函数
    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    // 移除收藏
    const removeFavorite = (venueId) => {
        fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ venueId, action: 'remove' })
        })
        .then(res => res.json())
        .then(() => {
            const updatedFavorites = favorites.filter(fav => fav.venueId !== venueId);
            setFavorites(updatedFavorites);
            setFilteredFavorites(updatedFavorites.filter(fav => 
                !searchQuery || fav?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            ));
        })
        .catch(err => console.error('Error removing favorite:', err));
    };

    // 清除搜索
    const handleClearSearch = () => setSearchQuery('');

    // 批量删除
    const removeAll = async () => {
        if (!window.confirm(`Remove all ${sortedFavorites.length} displayed favorites?`)) return;

        try {
            const response = await fetch('/api/clearFavorites', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data.success) {
                const removedIds = sortedFavorites.map(fav => fav.venueId || fav._id);
                const updatedFavorites = favorites.filter(fav => 
                    !removedIds.includes(fav.venueId || fav._id)
                );
                setFavorites(updatedFavorites);
                setFilteredFavorites([]);
            } else {
                alert('Failed to remove favorites: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    if (loading) return <div className="text-center p-5">Loading favorites...</div>;
    if (error) return <div className="alert alert-danger">Error: {error}</div>;

    return (
        <div className="container mt-4">
            {/* 搜索栏 */}
            <div className="mb-4">
                <div className="row">
                    <div className="col-12">
                        <div className="card border h-100">
                            <div className="card-body p-3 d-flex flex-column justify-content-center">
                                <h6 className="card-title mb-2">
                                    <i className="bi bi-search me-2"></i>
                                    Search Favorites
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
                </div>
            </div>

            {/* 分页和批量操作 - 在同一行 */}
        <div className="mt-3 d-flex justify-content-between align-items-center">
            {/* 分页控件 */}
            <div className="d-flex align-items-center">
                <nav aria-label="Favorites pagination">
                    <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button 
                                className="page-link" 
                                onClick={goToPrevPage}
                                disabled={currentPage === 1}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>
                        </li>
                        
                        <li className="text-muted">
                            <span className="page-link">
                                Page {currentPage} of {totalPages}
                            </span>
                        </li>
                        
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button 
                                className="page-link" 
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
            
            {/* 批量操作按钮 - 右对齐 */}
            <div>
                <button 
                    className="btn btn-outline-danger"
                    onClick={removeAll}
                    disabled={sortedFavorites.length === 0}
                >
                    <i className="bi bi-trash me-1"></i>
                    Remove All ({sortedFavorites.length})
                </button>
            </div>
        </div>
            
            {sortedFavorites.length === 0 ? (
                <div id="no-fav-content" className="text-center py-4 text-muted">
                    <i className="bi bi-search display-6"></i>
                    <h5 className="mt-3">
                        {searchQuery ? 'No matching favorites' : 'No favorite venues yet'}
                    </h5>
                    <p>
                        {searchQuery ? `No favorites match "${searchQuery}"` : 'Go to Home page to add some favorites!'}
                    </p>
                    {searchQuery && (
                        <button 
                            className="btn btn-outline-primary mt-2"
                            onClick={handleClearSearch}
                        >
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th scope="col" className="text-center">
                                        <button 
                                            className="btn btn-sm favorite-sort-btn"
                                            onClick={() => handleSort('location')}
                                        >
                                            <span>Location</span>
                                            <span>{sortConfig.key === 'location' ? 
                                                (sortConfig.direction === 'asc' ? '↑' : '↓') : 
                                                '⇅'}</span>
                                        </button>
                                    </th>
                                    <th scope="col" className="text-center">
                                        <button 
                                            className="btn btn-sm favorite-sort-btn favorite-sort-btn-events"
                                            onClick={() => handleSort('events')}
                                        >
                                            <span>Number of Events</span>
                                            <span>{sortConfig.key === 'events' ? 
                                                (sortConfig.direction === 'asc' ? '↑' : '↓') : 
                                                '⇅'}</span>
                                        </button>
                                    </th>
                                    <th scope="col" className="text-center">Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((fav, index) => {
                                    const venueId = fav?.venueId || fav?._id || `fav-${index}`;
                                    const name = fav?.name || 'Unknown Venue';
                                    const eventCount = fav?.eventCount || fav?.events?.length || 0;
                                    const globalIndex = indexOfFirstItem + index;
                                    
                                    return (
                                        <tr key={venueId}>
                                            <td className="text-center">
                                                <div className="fw-bold">
                                                    <Link 
                                                        to={`/map?venueId=${venueId}`}
                                                        className="text-decoration-none text-primary"
                                                    >
                                                        {name}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span>{eventCount}</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex gap-2 justify-content-center">
                                                    <button 
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => removeFavorite(venueId)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

export default Favorite;