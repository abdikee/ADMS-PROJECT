import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  TreemapChart,
  Treemap
} from 'recharts';
import { cn } from '../../utils/cn.js';

// Enhanced Tooltip Component
const EnhancedTooltip = ({ active, payload, label, ...props }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Animated Line Chart
export function AnimatedLineChart({ data, height = 300, color = '#3b82f6' }) {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={animatedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={<EnhancedTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={3}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Animated Area Chart
export function AnimatedAreaChart({ data, height = 300, color = '#3b82f6' }) {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={animatedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={<EnhancedTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.3}
          strokeWidth={2}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Animated Bar Chart
export function AnimatedBarChart({ data, height = 300, colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'] }) {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={animatedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={<EnhancedTooltip />} />
        <Bar dataKey="value" animationDuration={1500} animationEasing="ease-out">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Animated Pie Chart
export function AnimatedPieChart({ data, height = 300, colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'] }) {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={animatedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          animationBegin={0}
          animationDuration={1500}
          animationEasing="ease-out"
        >
          {animatedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<EnhancedTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Radar Chart
export function AnimatedRadarChart({ data, height = 400, colors = ['#3b82f6', '#22c55e', '#f59e0b'] }) {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={animatedData}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
        <PolarRadiusAxis stroke="#6b7280" />
        <Radar
          name="Student A"
          dataKey="A"
          stroke={colors[0]}
          fill={colors[0]}
          fillOpacity={0.3}
          strokeWidth={2}
          animationDuration={1500}
          animationEasing="ease-out"
        />
        <Radar
          name="Student B"
          dataKey="B"
          stroke={colors[1]}
          fill={colors[1]}
          fillOpacity={0.3}
          strokeWidth={2}
          animationDuration={1500}
          animationEasing="ease-out"
        />
        <Radar
          name="Student C"
          dataKey="C"
          stroke={colors[2]}
          fill={colors[2]}
          fillOpacity={0.3}
          strokeWidth={2}
          animationDuration={1500}
          animationEasing="ease-out"
        />
        <Legend />
        <Tooltip content={<EnhancedTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Treemap Chart
export function AnimatedTreemapChart({ data, height = 400, colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'] }) {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  const CustomizedContent = ({ x, y, width, height, name, value, color }) => {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: '#fff',
            strokeWidth: 2,
            strokeOpacity: 1
          }}
        />
        {width > 50 && height > 30 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 5}
              fill="#fff"
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              fill="#fff"
              textAnchor="middle"
              fontSize="10"
            >
              {value}
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <TreemapChart data={animatedData} dataKey="size" aspectRatio={4 / 3}>
        <Tooltip content={<EnhancedTooltip />} />
        <Treemap
          content={<CustomizedContent />}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </TreemapChart>
    </ResponsiveContainer>
  );
}

// Multi-Series Chart
export function MultiSeriesChart({ data, height = 300, series = [] }) {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={animatedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={<EnhancedTooltip />} />
        <Legend />
        {series.map((s, index) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            dot={{ fill: s.color, r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={1500}
            animationEasing="ease-out"
            animationBegin={index * 200}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Progress Chart (Custom component for showing progress over time)
export function ProgressChart({ data, height = 300, targetValue = 100 }) {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={animatedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={<EnhancedTooltip />} />
        <Area
          type="monotone"
          dataKey="progress"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.3}
          strokeWidth={2}
          animationDuration={1500}
          animationEasing="ease-out"
        />
        <Line
          type="monotone"
          dataKey="target"
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Comparison Chart (for comparing multiple entities)
export function ComparisonChart({ data, height = 400, entities = [] }) {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={animatedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip content={<EnhancedTooltip />} />
        <Legend />
        {entities.map((entity, index) => (
          <Bar
            key={entity}
            dataKey={entity}
            fill={colors[index % colors.length]}
            animationDuration={1500}
            animationEasing="ease-out"
            animationBegin={index * 100}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
