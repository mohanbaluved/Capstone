import React from "react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { Button } from "../components/ui/button.tsx";
import { Code, ShieldCheck, Zap } from "lucide-react";

const Login: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-xl">
            <Code className="text-white w-10 h-10" />
          </div>
        </div>
        
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">AdaptiveAI</h1>
          <p className="mt-3 text-lg text-neutral-600">
            AI-Powered Adaptive Programming Assessment and Learning Platform
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 py-8">
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-200 text-left">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Zap className="text-blue-600 w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">AI Evaluation</p>
              <p className="text-xs text-neutral-500">Deep code analysis and feedback</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-200 text-left">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="text-green-600 w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Trust Model</p>
              <p className="text-xs text-neutral-500">Integrity-based scoring system</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={login} 
          className="w-full h-12 text-lg font-semibold rounded-xl bg-black hover:bg-neutral-800 transition-all shadow-lg"
        >
          Sign in with Google
        </Button>
        
        <p className="text-xs text-neutral-400">
          Secure authentication powered by Firebase
        </p>
      </div>
    </div>
  );
};

export default Login;
