import {
  BarChart3,
  BookOpen,
  Briefcase,
  DollarSign,
  Flame,
  Folder,
  Home,
  Lightbulb,
  Music,
  Palette,
  Rocket,
  Sparkles,
  Star,
  Target,
  Theater,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface ProjectIconOption {
  name: string;
  label: string;
  icon: LucideIcon;
}

export const PROJECT_ICONS: ProjectIconOption[] = [
  { name: "folder", label: "Folder", icon: Folder },
  { name: "target", label: "Target", icon: Target },
  { name: "briefcase", label: "Briefcase", icon: Briefcase },
  { name: "rocket", label: "Rocket", icon: Rocket },
  { name: "star", label: "Star", icon: Star },
  { name: "flame", label: "Flame", icon: Flame },
  { name: "lightbulb", label: "Lightbulb", icon: Lightbulb },
  { name: "palette", label: "Palette", icon: Palette },
  { name: "bar-chart", label: "Analytics", icon: BarChart3 },
  { name: "wrench", label: "Tools", icon: Wrench },
  { name: "home", label: "Home", icon: Home },
  { name: "sparkles", label: "Sparkles", icon: Sparkles },
  { name: "theater", label: "Theater", icon: Theater },
  { name: "music", label: "Music", icon: Music },
  { name: "book", label: "Book", icon: BookOpen },
  { name: "dollar", label: "Finance", icon: DollarSign },
];

const iconMap: Record<string, LucideIcon> = Object.fromEntries(
  PROJECT_ICONS.map((opt) => [opt.name, opt.icon]),
);

interface ProjectIconProps {
  name?: string;
  size?: number;
  className?: string;
}

export function ProjectIcon({
  name = "folder",
  size = 18,
  className,
}: ProjectIconProps) {
  const IconComponent = iconMap[name] || Folder;
  return <IconComponent size={size} className={className} />;
}
