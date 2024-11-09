import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import TripListItem from '../components/TripListItem';
import iconlogo from '../images/xplora-icon.png';


export const handleLogout = () => {
    const navigate = useNavigate();
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('ID');
    navigate('/login');
};

const app_name = 'xplora.fun'; // Replace with your actual production server domain, e.g., 'example.com'

function buildPath(route: string): string {
    if (process.env.NODE_ENV !== 'development') {
        return `https://${app_name}/${route}`;
    } else {
        return `http://localhost:5000/${route}`;
    }
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [trips, setTrips] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('firstName');
        localStorage.removeItem('lastName');
        localStorage.removeItem('ID');
        navigate('/login');
    };

    const handleAddTrip = () => {
        navigate('/addtrip');
    };

    useEffect(() => {
        const storedFirstName = localStorage.getItem('firstName');
        const storedLastName = localStorage.getItem('lastName');

        if (storedFirstName && storedLastName) {
            setFirstName(storedFirstName);
            setLastName(storedLastName);
        } else {
            navigate('/login');
        }

        // Fetch trips data
        const fetchTrips = async () => {
            try {
                const userId = localStorage.getItem("ID");
                const response = await fetch(buildPath(`api/users/${userId}/trips`));
                if (response.ok) {
                    const data = await response.json();
                    setTrips(data);
                } else {
                    console.error('Failed to fetch trips:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching trips:', error);
            }
        };

        fetchTrips();
    }, [navigate]);

    const handleDeleteTrip = async (tripId: string) => {
        try {
            const userId = localStorage.getItem("ID");
            await fetch(buildPath(`api/users/${userId}/trips/${tripId}`), { method: 'DELETE' });
            setTrips(trips.filter(trip => trip._id !== tripId));
        } catch (error) {
            console.error('Error deleting trip:', error);
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    return (
        <div className="dashboard">
            <div className='dashboard-header'>
                <div className='logo-welcome-section'>
                    <Link to="/">
                        <img src={iconlogo} alt="Xplora Logo" id="dashboard-logo" />
                    </Link>
                    <span id='welcome-text'>Welcome, {firstName} {lastName}!</span>
                </div>
                <div className='actions-section'>
                    <button id="profile-btn"><Link to="/profile">Profile</Link></button>
                    <button id="logout-button" onClick={handleLogout}>Logout</button>
                </div>
            </div>
            <div className='dashboard-main'>
                <div className='trip-list-container'>
                    <div className='trip-list-header'>
                        Your upcoming itineraries
                    </div>
                    <div className='search-container'>
                        <input
                            id='search-input'
                            type="text"
                            value={inputValue}
                            onChange={handleChange}
                            placeholder='Search by trip or city name...'
                        />
                        <i id="search-icon" className="fa fa-search"></i>
                    </div>
                    <button className="add-trip-btn" onClick={handleAddTrip}>+</button>


                    {/* Conditional rendering to check if trips is empty */}
                    {trips.length === 0 ? (
                        // If there are no trips, display this message
                        <div className="no-trips-message">No trips yet</div>
                    ) : (
                        // If there are trips, map over them and display each one
                        trips.map((trip) => (
                            <TripListItem
                                key={trip._id}
                                title={trip.name}
                                location={trip.city}
                                dates={`${trip.start_date} - ${trip.end_date}`}
                                onDelete={() => handleDeleteTrip(trip._id)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;