'use client'

import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { saveUserToDatabase, getUserDetails } from "@/utils/firebase"
import GroupManager from "@/components/GroupManager"
import GroupList from "@/components/GroupList"
import TimezoneSelector from "@/components/TimezoneSelector"

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

  const handleTimezoneSelect = async (timezone) => {
    if (session?.user) {
      try {
        // Update user data with selected timezone
        await saveUserToDatabase({ ...session.user, timezone })
        setUserTimezone(timezone); // Update user timezone state
        setTimezoneSelected(true); // Mark timezone as selected
      } catch (error) {
        console.error("Failed to save timezone:", error)
      }
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (session) {
    return (
      <div className="min-h-screen flex flex-col items-center p-8 bg-gray-50">
        {/* Display user's timezone if selected */}
        {timezoneSelected ? (
          <div className="mb-4">Your selected timezone: {userTimezone}</div>
        ) : (
          <TimezoneSelector onTimezoneSelect={handleTimezoneSelect} />
        )}

        {/* Header */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-8 bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <Image
              src={session.user.image}
              alt="Profile picture"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="font-medium">{session.user.name}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
          >
            Sign out
          </button>
        </div>

        {/* Calendar */}
        <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Your Calendar</h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => {
                const startDate = formatDate(event.start?.dateTime || event.start?.date)
                const endDate = event.end?.dateTime ? formatDate(event.end.dateTime) : null
                
                return (
                  <div 
                    key={event.id} 
                    className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    {/* Date Column */}
                    <div className="flex flex-col items-center justify-center w-20 h-20 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600">{startDate.month}</span>
                      <span className="text-2xl font-bold">{startDate.day}</span>
                      <span className="text-xs text-gray-600">{startDate.weekday}</span>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{event.summary}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {startDate.time}
                          {endDate && ` - ${endDate.time}`}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
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

        {/* Groups */}
        <GroupList session={session} />
        <GroupManager session={session} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button 
        onClick={handleSignIn}
        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
      >
        <img 
          src="https://www.google.com/favicon.ico" 
          alt="Google logo" 
          className="w-5 h-5"
        />
        Sign in with Google
      </button>
    </div>
  )
}
