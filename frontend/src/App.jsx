import { useState } from 'react'
import Home from './pages/Home'
import Measurements from './pages/Measurements'
import Plans from './pages/Plans'
import NewMeasurement from './pages/NewMeasurement'
import CalorieHistory from './pages/CalorieHistory'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />
      case 'measurements':
        return <Measurements onNavigate={setCurrentPage} />
      case 'plans':
        return <Plans onNavigate={setCurrentPage} />
      case 'calories':
        return <CalorieHistory onNavigate={setCurrentPage} />
      case 'new-measurement':
        return <NewMeasurement onNavigate={setCurrentPage} />
      default:
        return <Home onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <button
                onClick={() => setCurrentPage('home')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === 'home'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                🏠 Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('measurements')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === 'measurements'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                📊 Misurazioni
              </button>
              <button
                onClick={() => setCurrentPage('calories')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === 'calories'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                🍽️ Calorie
              </button>
              <button
                onClick={() => setCurrentPage('plans')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === 'plans'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                📋 Piani
              </button>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setCurrentPage('new-measurement')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                + Nuova Misurazione
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {renderPage()}
      </main>
    </div>
  )
}

export default App
