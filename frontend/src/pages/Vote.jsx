import { useState } from 'react';

export default function Vote() {
  const [code, setCode] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === '1234') { // Example code
      setShowOptions(true);
    } else {
      alert('Invalid code');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Vote</h1>
      {!showOptions ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-96">
          <input 
            type="text" 
            placeholder="Enter Voting Code" 
            className="w-full p-2 mb-4 border rounded"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Submit</button>
        </form>
      ) : (
        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-xl font-bold mb-4">Voting Options</h2>
          <button className="bg-green-500 text-white px-4 py-2 rounded mr-4 hover:bg-green-600">Option A</button>
          <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Option B</button>
        </div>
      )}
    </div>
  );
}
