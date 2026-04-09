import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("CRITICAL: Missing Supabase configuration in authMiddleware.");
    return res.status(500).json({ 
      error: "Server configuration error", 
      details: "Supabase environment variables are missing. Please check your Vercel settings." 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw error || new Error("User not found");
    }

    (req as any).user = {
      uid: user.id,
      email: user.email,
      ...user.user_metadata
    };
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};
