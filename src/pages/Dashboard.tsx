import React from "react";
import Layout from "../components/layout/Layout.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.tsx";
import { Progress } from "../components/ui/progress.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { Button } from "../components/ui/button.tsx";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { Brain, Target, Shield, TrendingUp, ArrowRight, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const masteryData = profile?.topicMastery ? Object.entries(profile.topicMastery).map(([topic, score]) => ({
    subject: topic,
    A: score,
    fullMark: 100,
  })) : [
    { subject: 'Arrays', A: 0, fullMark: 100 },
    { subject: 'Strings', A: 0, fullMark: 100 },
    { subject: 'Logic', A: 0, fullMark: 100 },
    { subject: 'Complexity', A: 0, fullMark: 100 },
    { subject: 'Best Practices', A: 0, fullMark: 100 },
  ];

  const trendData = [
    { name: 'Week 1', score: 20 },
    { name: 'Week 2', score: 35 },
    { name: 'Week 3', score: 45 },
    { name: 'Week 4', score: profile?.skillScore || 50 },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.displayName}</h1>
            <p className="text-neutral-500">Track your progress and improve your coding skills with AI-driven insights.</p>
          </div>
          <Button onClick={() => navigate("/assessment")} size="lg" className="bg-black hover:bg-neutral-800">
            Start New Assessment
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Skill Score</p>
                  <h3 className="text-2xl font-bold">{Math.round(profile?.skillScore || 0)}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Brain className="text-blue-600 w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>{profile?.skillLevel}</span>
                  <span>Next: {profile?.skillLevel === 'Expert' ? 'Max' : 'Next Level'}</span>
                </div>
                <Progress value={profile?.skillScore} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Trust Weight</p>
                  <h3 className="text-2xl font-bold">{Math.round((profile?.trustWeight || 0) * 100)}%</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <Shield className="text-green-600 w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-neutral-500">Based on integrity and consistency</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Integrity</p>
                  <h3 className="text-2xl font-bold">{profile?.integrityScore || 0}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Target className="text-purple-600 w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-neutral-500">Assessment behavior score</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Confidence</p>
                  <h3 className="text-2xl font-bold">{profile?.confidenceScore || 0}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <TrendingUp className="text-orange-600 w-5 h-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-neutral-500">Submission quality metric</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Skill Mastery</CardTitle>
              <CardDescription>Topic-wise proficiency breakdown</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masteryData}>
                  <PolarGrid stroke="#e5e5e5" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#737373' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Mastery"
                    dataKey="A"
                    stroke="#000"
                    fill="#000"
                    fillOpacity={0.1}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Skill Progression</CardTitle>
              <CardDescription>Your growth over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#000" 
                    strokeWidth={3} 
                    dot={{ r: 6, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recommended Modules</CardTitle>
              <CardDescription>Based on your current skill gaps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: 'Advanced Array Manipulation', topic: 'Arrays', difficulty: 'Medium', time: '45m' },
                  { title: 'Dynamic Programming Patterns', topic: 'Logic', difficulty: 'Hard', time: '1h 20m' },
                  { title: 'Clean Code: Naming Conventions', topic: 'Best Practices', difficulty: 'Easy', time: '20m' },
                ].map((module, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{module.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{module.topic}</Badge>
                          <span className="text-xs text-neutral-400">{module.difficulty} • {module.time}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Start</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Weak Areas</CardTitle>
              <CardDescription>Topics to focus on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { topic: 'Recursion', score: 24 },
                  { topic: 'Graph Theory', score: 15 },
                  { topic: 'Bit Manipulation', score: 32 },
                ].map((area, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{area.topic}</span>
                      <span className="text-neutral-500">{area.score}%</span>
                    </div>
                    <Progress value={area.score} className="h-1 bg-neutral-100" />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-8">View All Topics</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
