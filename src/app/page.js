'use client'

import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { saveUserToDatabase, getUserDetails } from "@/utils/firebase"
import GroupManager from "@/components/GroupManager"
import GroupList from "@/components/GroupList"
import TimezoneSelector from "@/components/TimezoneSelector"
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// Move formatDate outside component to avoid hydration issues
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return {
    day: date.toLocaleDateString('en-US', { day: 'numeric' }),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
  };
};

export default function Home() {
  const { data: session, status } = useSession()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [timezoneSelected, setTimezoneSelected] = useState(false)
  const [userTimezone, setUserTimezone] = useState(null) // State to hold user's timezone
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false); // State to control timezone selector visibility

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const initializeUser = async () => {
      if (session?.user) {
        try {
          // Fetch user details including timezone
          const userDetails = await getUserDetails(session.user.email);
          if (userDetails) {
            session.user.timezone = userDetails.timezone; // Set timezone from user details
            setUserTimezone(userDetails.timezone); // Set user timezone state
            setTimezoneSelected(!!userDetails.timezone); // Check if timezone is selected
          }
          await saveUserToDatabase(session.user);
        } catch (error) {
          console.error("Failed to save user to database:", error)
        }
      }
    }

    if (mounted) {
      initializeUser()
    }
  }, [session, mounted])

  const handleTimezoneSelect = async (timezone) => {
    if (session?.user) {
      try {
        // Update user data with selected timezone
        await saveUserToDatabase({ ...session.user, timezone })
        setUserTimezone(timezone); // Update user timezone state
        setTimezoneSelected(true); // Mark timezone as selected
        setShowTimezoneSelector(false); // Hide timezone selector
      } catch (error) {
        console.error("Failed to save timezone:", error)
      }
    }
  }

  const toggleTimezoneSelector = () => {
    setShowTimezoneSelector(!showTimezoneSelector);
  }

  useEffect(() => {
    const fetchEvents = async () => {
      if (session && mounted) {
        setLoading(true)
        try {
          const response = await fetch('/api/calendar')
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          setEvents(data)
        } catch (error) {
          console.error("Failed to fetch calendar events:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchEvents()
  }, [session, mounted])

  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return null
  }

  const handleSignIn = async () => {
    try {
      const result = await signIn("google", { 
        redirect: false,
        callbackUrl: "/",
      })
      
      if (result?.error) {
        console.error("Sign in error:", result.error)
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error("Sign in error:", error)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Initialize Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `profile_pictures/${session.user.email}`);

      // Upload the file
      await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update user's profile picture URL in Firestore
      const userRef = doc(db, 'users', session.user.email);
      await updateDoc(userRef, {
        image: downloadURL
      });

      // Update session
      session.user.image = downloadURL;
      window.location.reload(); // Refresh to show new image
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-red-200 to-red-300">
        {/* Top Bar with Timezone and User Info */}
        <div className="w-full px-8 pt-8">
          {/* Timezone Section */}
          {timezoneSelected ? (
            <div 
              className="mb-8 cursor-pointer text-center" 
              onClick={toggleTimezoneSelector}
            >
              <div className="text-3xl font-semibold text-gray-800 mb-2">Your Timezone</div>
              <div className="text-4xl font-bold text-gray-900">{userTimezone}</div>
            </div>
          ) : (
            <div className="mb-8">
              <TimezoneSelector onTimezoneSelect={handleTimezoneSelect} />
            </div>
          )}

          {showTimezoneSelector && (
            <div className="mb-8">
              <TimezoneSelector onTimezoneSelect={handleTimezoneSelect} />
            </div>
          )}

          {/* User Header */}
          <div className="w-full flex items-center justify-between mb-8 bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Image
                  src={session.user.image}
                  alt="Profile picture"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <svg 
                    className="w-5 h-5 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                  </svg>
                </label>
              </div>
              <span className="font-medium">{session.user.name}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Main Content Area - Split View */}
        <div className="flex gap-8 px-8 h-[calc(100vh-300px)]">
          {/* Left Side - Groups */}
          <div className="w-1/3 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Your Groups</h2>
            </div>
            <div className="px-6 pb-6 overflow-y-auto h-[calc(100%-100px)]">
              <GroupList session={session} />
              <GroupManager session={session} />
            </div>
          </div>

          {/* Right Side - Calendar */}
          <div className="w-2/3 bg-white rounded-lg shadow p-6 overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-6">Your Calendar (UTC)</h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : events.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="flex gap-4 min-w-max pb-4">
                  {/* Group events by date and create columns */}
                  {Array.from(Array(7)).map((_, index) => {
                    const date = new Date();
                    date.setDate(date.getDate() + index);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    const dayEvents = events.filter(event => {
                      const eventDate = new Date(event.start?.dateTime || event.start?.date);
                      return eventDate.toISOString().split('T')[0] === dateStr;
                    }).sort((a, b) => {
                      const aTime = new Date(a.start?.dateTime || a.start?.date);
                      const bTime = new Date(b.start?.dateTime || b.start?.date);
                      return aTime - bTime;
                    });

                    const dateFormat = formatDate(date.toISOString());

                    return (
                      <div key={dateStr} className="flex-none w-64">
                        {/* Date Header */}
                        <div className="text-center p-4 bg-gray-50 rounded-t-lg border border-gray-200">
                          <div className="text-sm text-gray-600">{dateFormat.weekday}</div>
                          <div className="text-2xl font-bold">{dateFormat.day}</div>
                          <div className="text-sm text-gray-600">{dateFormat.month}</div>
                        </div>

                        {/* Events Container */}
                        <div className="min-h-[400px] border border-t-0 border-gray-200 rounded-b-lg p-2 space-y-2">
                          {dayEvents.map((event) => {
                            const startDate = formatDate(event.start?.dateTime || event.start?.date);
                            const endDate = event.end?.dateTime ? formatDate(event.end.dateTime) : null;
                            
                            return (
                              <div 
                                key={event.id}
                                className="p-2 rounded bg-blue-50 border border-blue-100 hover:border-blue-300 transition-colors"
                              >
                                <div className="font-medium text-sm truncate">
                                  {event.summary}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {startDate.time}
                                  {endDate && ` - ${endDate.time}`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No upcoming events found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-100 via-red-200 to-red-300">
      <div className="text-center mb-8">
        <Image
          src="/Logo2.png"
          alt="ZyncUp Logo"
          width={80}
          height={80}
          className="mx-auto mb-2"
        />
        <Image
          src="/Picture1.png"
          alt="ZyncUp Name"
          width={200}
          height={67}
          className="mx-auto"
        />
      </div>
      <div className="bg-white rounded-lg shadow-lg p-8 w-80">
        <button 
          onClick={handleSignIn}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#B5C9B7] text-white rounded-md w-full hover:bg-[#9DB7A0] transition-colors"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google logo" 
            className="w-5 h-5"
          />
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
