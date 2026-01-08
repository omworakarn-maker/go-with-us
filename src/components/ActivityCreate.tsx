import React, { useState } from 'react';

interface Activity {
  id: number;
  name: string;
  description: string;
}

const ActivityCreate: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const newActivity: Activity = {
      id: Date.now(),
      name,
      description,
    };
    setActivities([...activities, newActivity]);
    setName('');
    setDescription('');
  };

  const handleDelete = (id: number) => {
    setActivities(activities.filter(act => act.id !== id));
  };

  return (
    <div>
      <h2>สร้างกิจกรรมใหม่</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>ชื่อกิจกรรม:</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label>รายละเอียด:</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <button type="submit">เพิ่มกิจกรรม</button>
      </form>
      <h3>รายการกิจกรรม</h3>
      <ul>
        {activities.map(act => (
          <li key={act.id}>
            <b>{act.name}</b>: {act.description}
            <button style={{marginLeft: 8, color: 'red'}} onClick={() => handleDelete(act.id)}>ลบ</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityCreate;
