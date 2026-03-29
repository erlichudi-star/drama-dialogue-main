import { Globe, MessageCircle, Facebook, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceIconProps {
  source: string;
  className?: string;
}

export function SourceIcon({ source, className }: SourceIconProps) {
  const normalized = source.toLowerCase();

  if (normalized.includes("whatsapp")) {
    return <MessageCircle className={cn(className)} />;
  }
  if (normalized.includes("facebook")) {
    return <Facebook className={cn(className)} />;
  }
  if (normalized.includes("website") || normalized.includes("elementor")) {
    return <Globe className={cn(className)} />;
  }
  return <Users className={cn(className)} />;
}
