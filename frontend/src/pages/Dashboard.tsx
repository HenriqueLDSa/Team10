import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import TripListItem from '../components/TripListItem';
import ProfileDropdown from '../components/ProfileDropdown'
import iconlogo from '../images/xplora-icon.png';


export const handleLogout = () => {
    const navigate = useNavigate();
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('ID');
    localStorage.removeItem('email');
    navigate('/login');
};

const app_name = 'xplora.fun'; 
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
    const [email, setEmail] = useState<string>('');
    const [password] = useState<string>('');
    const [trips, setTrips] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const renderProfile = () => {
        
        if (isEditing) {
            return (
                <ProfileDropdown
                    firstName = {firstName}
                    lastName = {lastName}
                    email = {email}
                    password = {''}

                    onEditProfile={() => handleEditProfile()} 
                    onSaveProfile={() => handleSaveProfile(firstName, lastName, email, password)}
                    onCancelProfile={() => handleCancelProfile()}

                    isEditing={true}
                    isMenuOpen={true}
                />
            )
        }
        
        return (
            <ProfileDropdown
                firstName = {firstName}
                lastName = {lastName}
                email = {email}
                password = {'*************'}

                onEditProfile={() => handleEditProfile()} 
                onSaveProfile={ (newFirstName, newLastName, newEmail, newPassword) =>
                    handleSaveProfile(newFirstName, newLastName, newEmail, newPassword)
                }
                onCancelProfile={() => handleCancelProfile()}

                isEditing={false}
                isMenuOpen={true}
            />
        )
    }

    const handleEditProfile = () => {
        setIsEditing(true);
    }

    const handleCancelProfile = () => {
        setIsEditing(false);
        setIsMenuOpen(false);
    }

    const handleSaveProfile = async (newFirstName: string, newLastName: string, newEmail: string, newPassword: string) => {
        try {
            setFirstName(newFirstName);
            setLastName(newLastName);
            setEmail(newEmail);
    
            localStorage.setItem('firstName', newFirstName);
            localStorage.setItem('lastName', newLastName);
            localStorage.setItem('email', newEmail);
            
            const userId = localStorage.getItem('ID');
            const response = await fetch(buildPath(`api/users/${userId}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: newFirstName,
                    last_name: newLastName,
                    email: newEmail,
                    password: newPassword,
                }),

                
            });
    
            if (!response.ok) {
                throw new Error('Failed to save profile');
            }
    
            setIsEditing(false);
            console.log('Profile updated successfully');

        } catch (error) {
            console.error('Error saving profile:', error);
        
        }

        renderProfile();
    };
    

    const handleLogout = () => {
        localStorage.removeItem('firstName');
        localStorage.removeItem('lastName');
        localStorage.removeItem('ID');
        localStorage.removeItem('email');
        navigate('/login');
    };

    const handleAddTrip = () => {
        navigate('/addtrip');
    };

    const handleEditTrip = (tripId: string) => {
        navigate(`/trip-details/${tripId}`);
    };

    useEffect(() => {
        const storedFirstName = localStorage.getItem('firstName');
        const storedLastName = localStorage.getItem('lastName');
        const storedEmail = localStorage.getItem('email');

        if (storedFirstName && storedLastName && storedEmail) {
            setFirstName(storedFirstName);
            setLastName(storedLastName);
            setEmail(storedEmail);
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

            // alert added to make sure user wants to delete 
            const confirmDelete = window.confirm("Are you sure you want to delete this trip?");
            if (!confirmDelete) return;

            await fetch(buildPath(`api/users/${userId}/trips/${tripId}`), { method: 'DELETE' });
            setTrips(trips.filter(trip => trip._id !== tripId));
        } catch (error) {
            console.error('Error deleting trip:', error);
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };


    const filteredTrip = trips.filter((trip) =>{
        const searchTerm = inputValue.toLowerCase();
        const tripName = trip.name.toLowerCase();
        const tripCity = trip.city.toLowerCase();
        return tripName.includes(searchTerm) || tripCity.includes(searchTerm);
    })

    // Conditional rendering using if-else statements
        const renderTrips = () => {

            // No trips at all
            if (trips.length === 0) {
                return <div className="no-trips-message">No upcoming itineraries</div>;
            }

            // Trips exist, but no trips match the search input
            if (filteredTrip.length === 0 && inputValue) {
                return <div className="no-trips-message">Trip not found</div>;
            }

            // Trips exist and match the search input
            if (filteredTrip.length > 0) {
                return filteredTrip.map((trip) => (
                    <TripListItem
                        key={trip._id}
                        title={
                            <Link to={`/trip-details/${trip._id}`} className='trip-link'>
                                {trip.name}
                             </Link>
                        }
                        location={trip.city}
                        dates={`${trip.start_date} - ${trip.end_date}`}
                        onDelete={() => handleDeleteTrip(trip._id)}
                        onEdit={() => handleEditTrip(trip._id)} 
                    />
                ));
            }

            // Default case (fallback)
            return null;
        };

    return (
        <div className="dashboard">
            <div className='dashboard-header'>
                <div className='logo-welcome-section'>
                    <Link to="/dashboard">
                        <img src={iconlogo} alt="Xplora Logo" id="dashboard-logo" />
                    </Link>
                    <span id='welcome-text'>Welcome, {firstName} {lastName}!</span>
                </div>
                
                <div className='actions-section'>
                    <button id="profile-btn" onClick={toggleMenu}>Profile</button>
                    {isMenuOpen && (
                        <ProfileDropdown
                        firstName={firstName}
                        lastName={lastName}
                        email={email}
                        password={'*************'}
                        onEditProfile={handleEditProfile}
                        onSaveProfile={handleSaveProfile}
                        onCancelProfile={handleCancelProfile}
                        isEditing={isEditing}
                        isMenuOpen={true}
                        />  
                    )}
                                                                                                  
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


                    {renderTrips()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;