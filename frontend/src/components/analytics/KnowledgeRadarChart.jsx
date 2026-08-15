import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const KnowledgeRadarChart = ({ subjects = [] }) => {
  const isFallback = subjects.length < 3;

  const chartData = subjects.map((sub) => ({
    subject: sub.subjectName,
    readiness: sub.overallScore || 0,
    coverage: sub.breakdown?.syllabusCoverage || 0,
    accuracy: sub.breakdown?.quizAccuracy || 0,
  }));

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="border-b border-neutral-800 pb-4">
        <h3 className="text-stone-100 font-extrabold font-playfair text-lg">Subject Mastery Map</h3>
        <p className="text-stone-400 text-xs mt-0.5">Comparing relative readiness scores across subjects</p>
      </div>

      <div className="w-full h-72 flex items-center justify-center">
        {isFallback ? (
          // Fallback to BarChart if less than 3 subjects
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="subject" stroke="#737373" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#737373" fontSize={10} tickLine={false} axisLine={false} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#e5e5e5', borderRadius: '8px', fontSize: '11px' }}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Bar dataKey="readiness" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          // Radar Chart for 3+ subjects
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              <PolarGrid stroke="#262626" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#a3a3a3', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#737373', fontSize: 8 }} />
              <Radar name="Readiness" dataKey="readiness" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#e5e5e5', borderRadius: '8px', fontSize: '11px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Accessibility Fallback Data Table (Screen Reader Friendly) */}
      <div className="sr-only">
        <h4>Screen Reader Data Table: Subject Readiness</h4>
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Overall Score</th>
              <th>Syllabus Coverage</th>
              <th>Quiz Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((data, idx) => (
              <tr key={idx}>
                <td>{data.subject}</td>
                <td>{data.readiness}%</td>
                <td>{data.coverage}%</td>
                <td>{data.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KnowledgeRadarChart;
