import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'

function Login(props) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData);
            console.log('Form data:', data);
            
            const submitter = event.nativeEvent.submitter;
            const action = submitter.value
            
            let response = null;
            let url = '';
            
            if (action === "login") {
                url = '/api/login';
            } else if (action === "signup") {
                url = '/api/signup';
            }
            
            console.log('Doing:', url);
            
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: data.username,
                    password: data.password,
                    rememberMe: data.rememberMe === 'on'
                })
            });

            console.log('LogIn/SignUp response status code:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Login success:', result);

                // ✅ 关键：登录成功后获取并保存数据
                await fetchAndSaveVenuesData();

                // 存储数据获取时间
                const fetchTime = new Date();
                localStorage.setItem('dataFetchTime', fetchTime.toISOString());
                
                // Redirect or update parent component
                if (props.setUser) {
                    console.log(result);
                    console.log(result.user);
                    props.setUser(result.user);
                }
                
                navigate('/');
                
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.message || `Login failed: ${response.status}`);
                // window.alert(errorData.message || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            setError('Network error. Please try again.');
            window.alert('Network error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ 新增：获取并保存场地数据的函数
    const fetchAndSaveVenuesData = async () => {
        try {
            console.log("Fetching venues data after login...");
            const response = await fetch("/api/fetchEvents");
            const data = await response.json();
            // console.log("Received venues data:", data.length, "items");
            
            if (data.length > 0) {
                // 随机选择10个
                const shuffled = [...data];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                const selected = shuffled.slice(0, 10);
                
                // 保存到 localStorage
                localStorage.setItem('selectedVenues', JSON.stringify(selected));
                console.log("Saved venues to localStorage");
            } else {
                console.warn("No suitable venues found");
                localStorage.removeItem('selectedVenues');
            }
        } catch (error) {
            console.error('Error fetching venues data:', error);
            localStorage.removeItem('selectedVenues');
        }
    };

    return (
        <div className="login-container m-auto mt-5 w-75">
            <h1 className="mx-auto my-3 text-center text-success">Welcome to my page!</h1>
            <h2 className="mx-auto mb-3 text-center">Login / Sign Up</h2>
            
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        required
                        className="form-control"
                        autoComplete="username"
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        className="form-control"
                        autoComplete="current-password"
                        disabled={isLoading}
                        minLength="8"
                    />
                </div>

                <div className="form-check mt-3 d-flex justify-content-start">
                    <input
                        type="checkbox"
                        id="rememberMe"
                        name="rememberMe"
                        className="form-check-input"
                        disabled={isLoading}
                    />
                    <label htmlFor="rememberMe" className="form-check-label mx-1">
                        Remember me
                    </label>
                </div>

                <div className="mt-3">
                    <button
                        type="submit"
                        className="btn btn-primary m-2 btn-md"
                        disabled={isLoading}
                        value="login"
                    >
                        {isLoading ? 'Loading...' : 'Login'}
                    </button>
                    
                    <button
                        type="submit"
                        className="btn btn-secondary m-2 btn-md"
                        disabled={isLoading}
                        value="signup"
                    >
                        Sign Up
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Login;