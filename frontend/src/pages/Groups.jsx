import { useState, useEffect } from 'react';

export default function Groups() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetch('/api/groups')
      .then(res => res.json())
      .then(data => setGroups(data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Groups</h1>
      <div className="grid gap-6">
        {groups.map(group => (
          <div key={group.id} className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-bold mb-2">{group.name}</h2>
            <p className="text-gray-600 mb-4">{group.description}</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Apply</button>
          </div>
        ))}
      </div>
    </div>
  );
}
