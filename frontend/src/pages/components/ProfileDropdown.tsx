import React, { useState } from 'react';
import * as yup from 'yup';
import '../css-files/Dashboard.css'
import defaultprofile from '../../images/default_profile.png';
import { act } from 'react-dom/test-utils';


interface ProfileDropdownProps {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    id: string;
    resetToken: string;

    onEditProfile: () => void;
    // onSaveProfile: () => void;
    onSaveProfile: (newFirstName: string, newLastName: string, newEmail: string, newPassword: string) => void;
    onCancelProfile: () => void;

    isEditing: boolean;
    isMenuOpen: boolean;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ firstName, lastName, email, password, id, resetToken, onEditProfile, onSaveProfile, onCancelProfile, isEditing, isMenuOpen }) => {
    const [newFirstName, setNewFirstName] = useState<string>(firstName);
    const [newLastName, setNewLastName] = useState<string>(lastName);
    const [newEmail] = useState<string>(email);
    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const [profilePic, setProfilePic] = useState<string>(defaultprofile);

    // Password schema only required when currentPassword has input
    const [isEditingPassword, setIsEditingPassword] = useState(false);

    // good
    const profileChangeSchema = yup.object().shape({
        newFirstName: yup.string().required('First name is required'),
        newLastName: yup.string().required('Last name is required'),
        newEmail: yup
            .string()
            .email('Invalid email address')
            .required('Email is required'),
        currentPassword: yup
            .string()
            .test('current-password-required', 'Current password is required', function (value) {
                return !this.options.context?.isEditingPassword || !!value?.trim();
            }),
            newPassword: yup
            .string()
            .test('new-password-required', 'New password is required', function (value) {
                if (this.options.context?.isEditingPassword) {
                    return !!value?.trim();
                }
                return true;
            })
            .when('$isEditingPassword', {
                is: true,
                then: (schema) =>
                    schema
                        .min(8, 'Password must be at least 8 characters')
                        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
                        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
                        .matches(/[0-9]/, 'Password must contain at least one number')
                        .matches(/[\W_]/, 'Password must contain at least one special character'),
                otherwise: (schema) => schema,
            }),
        confirmPassword: yup
            .string()
            .oneOf([yup.ref('newPassword')], 'Passwords must match')
            .test('confirm-password-required', 'Confirm password is required', function (value) {
                if (this.options.context?.isEditingPassword) {
                    return !!value?.trim();
                }
                return true;
            }),
    });
   
    // good
    const toggleEditPassword = () => {
        setIsEditingPassword(currentPassword.trim().length > 0);
    };

    //
    const handleSaveChange = async () => {
        const profileData = {
            newFirstName,
            newLastName,
            newEmail,
            currentPassword,
            newPassword,
            confirmPassword,
        };

        try {
            await profileChangeSchema.validate(profileData, {
                abortEarly: false,
                context: { isEditingPassword },
            });

            // If password editing is active, validate the current password
            if (isEditingPassword && currentPassword !== password) {
                setErrorMessages((prev) => ({
                    ...prev,
                    currentPassword: 'Current password is incorrect.',
                }));
                return;
            }

            // If a reset is being performed (through the token and id)
            await act(async () => {
                if (resetToken && id && newPassword.trim()) {
                    // Make API call to reset password
                    const response = await fetch('/api/reset-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            token: resetToken,
                            id,
                            newPassword,
                        }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Password reset successful
                        setErrorMessages({});
                        alert(data.message);
                    } else {
                        // Handle error from API
                        setErrorMessages({ resetPassword: data.error });
                    }
                } else {
                    // Save profile data if validation passes
                    onSaveProfile(newFirstName, newLastName, newEmail, newPassword);
                    setErrorMessages({}); // Clear errors on success
                }
        });
     } catch (error) {
            if (error instanceof yup.ValidationError) {
                const newErrors: Record<string, string> = {};
                error.inner.forEach((err) => {
                    if (err.path) {
                        newErrors[err.path] = err.message;
                    }
                });
                setErrorMessages(newErrors);
            }
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if(!event.target.files || event.target.files.length === 0){
            return;
        }

        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        const userId = localStorage.getItem('ID');

        try {
            const response = await fetch(`/api/users/:${userId}`, {
                method: 'PUT',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                const uploadedImageUrl = data.filePath;
                setProfilePic(uploadedImageUrl);
                location.reload();
            } else {
                console.error('Error uploading file:', await response.text());
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    };
    
    return(
        <div className={`profile-menu-container ${isMenuOpen ? 'open-menu' : ''}`} id="profile-menu">          
            {/* Conditional classNames based on isEditing status */}
            <div className={`profile-info ${isEditing ? "editing" : ""}`}>                           
                {isEditing ? (
                    <>
                    <div className='profile-img-wrapper'>
                        <div className="profile-img-container">
                            <img src={profilePic || defaultprofile} alt="Profile Icon" />
                        </div>
                        <div>
                                <i 
                                    id="trip-item-edit-icon-2" 
                                    className='fa fa-pen-alt' 
                                    onClick={() => document.getElementById('file-input')?.click()} 
                                ></i>
                        </div>
                            <input
                                type="file"
                                id="file-input"
                                accept="image/jpeg, image/png, image/jpg"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                    </div>
                        <div className="edit-info">
                            <input id="edit-first-name"
                                type="text"
                                value={newFirstName}
                                onChange={
                                    (e) => setNewFirstName(e.target.value)
                                }
                                placeholder="First Name"
                            />
                            <input id="edit-last-name"
                                type="text"
                                value={newLastName}
                                onChange={
                                    (e) => setNewLastName(e.target.value)
                                }
                                placeholder="Last Name"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        {/* <div className="profile-img-container"> */}
                            <img className="img-name" src={defaultprofile} alt="Profile Icon"/>
                            <div className="img-name" id="name"><h2 id="profile-menu-fn">{firstName}</h2><h2 id="profile-menu-ln">{lastName}</h2></div>
                        {/* </div> */}
                    </> 
                )}
            </div>
            <div className={`profile-info ${isEditing ? "editing" : ""}`}>
                    {isEditing ? (
                        <>
                            <div className='edit-info'>
                                <div id="email" className="non-editable-email">
                    {newEmail}
                </div>
                            </div>
                        </>
                    ) : (
                        <div className="edit-info-d">{email}</div>
                    )}
            </div>
            <div className={`profile-info ${isEditing ? "editing" : ""}`}>
                    {isEditing ? (
                        <>
                            <div className="edit-info">
                                <div className="password-field">
                                    <input id="current-password"
                                        type="password"
                                        value={currentPassword}
                                        onInput={toggleEditPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Current Password"
                                    />

                                    {errorMessages.currentPassword && (
                                        <div className="error-flag show">
                                            <span>{errorMessages.currentPassword}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="password-field">
                                    <input id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New Password"
                                    />

                                    {errorMessages.newPassword && (
                                        <div className="error-flag show">
                                            <span>{errorMessages.newPassword}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="password-field">
                                    <input id="confirm-new-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm New Password"
                                    />

                                    {errorMessages.confirmPassword && (
                                        <div className="error-flag show">
                                            <span>{errorMessages.confirmPassword}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>

                    ) : (
                        <>
                            <div className="edit-info-d">{password}</div>
                        </>

                    )}
            </div>
            <div className={`profile-info ${isEditing ? "editing" : ""}`}>
                {isEditing ? (
                    <>
                        {/* <button
                            data-testid="profile-cancel-button"
                            id="profile-cancel-button"
                            className="profile-action-button"
                            
                            > */}
                            <i onClick={onCancelProfile} className="far fa-times-circle" id="profile-cancel-icon" />
                        {/* </button> */}

                        {/* <button
                            data-testid="profile-save-button"
                            id="profile-save-button"
                            className="profile-action-button"
                            
                            > */}
                            <i onClick={handleSaveChange} className="far fa-check-circle" id="profile-save-icon" />
                        {/* </button> */}
                    </>
                ) : (
                    <>
                        {/* <button
                            data-testid="profile-cancel-button"
                            id="profile-cancel-button"
                            className="profile-action-button"
                            
                            > */}
                            <i onClick={onCancelProfile} className="far fa-times-circle" id="profile-cancel-icon" />
                        {/* </button> */}

                        {/* <button
                            data-testid="profile-edit-button"
                            id="profile-edit-button"
                            className="profile-action-button"
                            
                            > */}
                            <i onClick={onEditProfile} className='fa fa-edit' id="profile-edit-icon"/>
                        {/* </button> */}
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfileDropdown;