interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export default function MiniSparkline({ 
  data, 
  width = 100, 
  height = 40,
  color 
}: MiniSparklineProps) {
  if (!data || data.length === 0) {
    return <div style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Generate SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });
  
  const pathData = `M ${points.join(' L ')}`;
  
  // Determine color based on trend (first vs last)
  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = color || (isPositive ? '#22c55e' : '#ef4444');
  
  return (
    <svg width={width} height={height} className="inline-block">
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
