import { 
  AlertTriangle, 
  RotateCcw, 
  Network, 
  Headphones, 
  Smartphone, 
  Activity, 
  TrendingUp, 
  Server, 
  Radio, 
  Clipboard, 
  FileText, 
  Database, 
  Clock, 
  Hourglass, 
  Tag, 
  Phone, 
  Signal,
  Shield,
  Zap,
  Cpu,
  Wifi,
  HardDrive,
  Bell,
  CheckSquare,
  MessageSquare,
  HelpCircle
} from 'lucide-react';

export const ICON_MAP = {
  AlertTriangle,
  RotateCcw,
  Network,
  Headphones,
  Smartphone,
  Activity,
  TrendingUp,
  Server,
  Radio,
  Clipboard,
  FileText,
  Database,
  Clock,
  Hourglass,
  Tag,
  Phone,
  Signal,
  Shield,
  Zap,
  Cpu,
  Wifi,
  HardDrive,
  Bell,
  CheckSquare,
  MessageSquare
};

export const DEFAULT_CATEGORIES = [
  { id: 'cat-a', name: 'Afeta Clientes', iconName: 'AlertTriangle', key: 'a', shortcut: 'Ctrl+A', isDefault: true },
  { id: 'cat-b', name: 'BA Reverso', iconName: 'RotateCcw', key: 'b', shortcut: 'Ctrl+B', isDefault: true },
  { id: 'cat-g', name: 'BGP', iconName: 'Network', key: 'g', shortcut: 'Ctrl+G', isDefault: true },
  { id: 'cat-k', name: 'CX_COR_FIXA_N2', iconName: 'Headphones', key: 'k', shortcut: 'Ctrl+K', isDefault: true },
  { id: 'cat-m', name: 'CX_COR_MOVEL_N2', iconName: 'Smartphone', key: 'm', shortcut: 'Ctrl+M', isDefault: true },
  { id: 'cat-e', name: 'Em Monitoramento', iconName: 'Activity', key: 'e', shortcut: 'Ctrl+E', isDefault: true },
  { id: 'cat-l', name: 'Escalonamento', iconName: 'TrendingUp', key: 'l', shortcut: 'Ctrl+L', isDefault: true },
  { id: 'cat-i', name: 'IP', iconName: 'Server', key: 'i', shortcut: 'Ctrl+I', isDefault: true },
  { id: 'cat-u', name: 'ISUP', iconName: 'Radio', key: 'u', shortcut: 'Ctrl+U', isDefault: true },
  { id: 'cat-o', name: 'Observações', iconName: 'Clipboard', key: 'o', shortcut: 'Ctrl+O', isDefault: true },
  { id: 'cat-d', name: 'OD', iconName: 'FileText', key: 'd', shortcut: 'Ctrl+D', isDefault: true },
  { id: 'cat-h', name: 'OG', iconName: 'Database', key: 'h', shortcut: 'Ctrl+H', isDefault: true },
  { id: 'cat-p', name: 'Pendência IP', iconName: 'Clock', key: 'p', shortcut: 'Ctrl+P', isDefault: true },
  { id: 'cat-y', name: 'Pendencia TX', iconName: 'Hourglass', key: 'y', shortcut: 'Ctrl+Y', isDefault: true },
  { id: 'cat-r', name: 'RDM', iconName: 'Tag', key: 'r', shortcut: 'Ctrl+R', isDefault: true },
  { id: 'cat-s', name: 'SIP', iconName: 'Phone', key: 's', shortcut: 'Ctrl+S', isDefault: true },
  { id: 'cat-t', name: 'TX', iconName: 'Signal', key: 't', shortcut: 'Ctrl+T', isDefault: true }
];

const STORAGE_KEY = 'openjournal_custom_categories';

/**
 * Resolve o componente de ícone Lucide a partir do nome ou fallback
 */
export function getCategoryIconComponent(iconName) {
  if (iconName && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return Tag;
}

/**
 * Carrega a lista atualizada de categorias salvas no localStorage
 */
export function getStoredCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch (err) {
    console.error('Erro ao ler categorias do localStorage:', err);
    return DEFAULT_CATEGORIES;
  }
}

/**
 * Salva a lista de categorias no localStorage
 */
export function saveStoredCategories(categories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    // Dispara evento customizado para sincronizar componentes na mesma aba
    window.dispatchEvent(new CustomEvent('openjournal_categories_updated', { detail: categories }));
  } catch (err) {
    console.error('Erro ao salvar categorias no localStorage:', err);
  }
}

/**
 * Restaura a lista de categorias para o padrão inicial
 */
export function resetStoredCategoriesToDefault() {
  saveStoredCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}
