import { useState } from 'react';
import Header from '../Header';

export default function HeaderExample() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
    console.log('Refreshing...');
  };

  return (
    <div className="bg-background">
      <Header
        isOnline={true}
        lastUpdate={new Date()}
        onRefresh={handleRefresh}
        onAdd={() => console.log('Add clicked')}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}
