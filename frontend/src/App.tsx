import { useState, useEffect } from 'react'

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api')
      .then(res => res.json())
      .then(data => setMessage(data.Hello))
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Vite + React + Tailwind</h1>
        <div className="card">
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setCount((count) => count + 1)}
          >
            count is {count}
          </button>
          <p className="mt-4 text-gray-600">
            Message from backend: {message}
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
