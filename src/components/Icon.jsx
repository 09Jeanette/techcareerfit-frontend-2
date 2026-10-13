import {
  FiActivity, FiAlertTriangle, FiArrowRight, FiAward, FiBarChart2, FiBell, FiBookOpen, FiBriefcase, FiCalendar, FiCheck,
  FiCheckCircle, FiChevronDown, FiChevronLeft, FiChevronRight, FiClock, FiCpu, FiDatabase, FiDollarSign, FiDownload, FiEdit3,
  FiEye, FiEyeOff, FiFileText, FiFilter, FiFrown, FiGlobe, FiGrid, FiHome, FiInbox, FiLayers, FiLock, FiLogOut, FiMail, FiMapPin,
  FiMeh, FiPlayCircle, FiPlus, FiRefreshCw, FiSearch, FiShield, FiSmile, FiStar, FiTarget, FiTrash2, FiTrendingUp, FiUpload,
  FiUser, FiUsers, FiX, FiXCircle, FiZap, FiExternalLink,
} from 'react-icons/fi';

const MAP = {
  Activity: FiActivity, AlertTriangle: FiAlertTriangle, ArrowRight: FiArrowRight, Award: FiAward, BarChart2: FiBarChart2, Bell: FiBell,
  BookOpen: FiBookOpen, Briefcase: FiBriefcase, Calendar: FiCalendar, Check: FiCheck, CheckCircle: FiCheckCircle, ChevronDown: FiChevronDown,
  ChevronLeft: FiChevronLeft, ChevronRight: FiChevronRight, Clock: FiClock, Cpu: FiCpu, Database: FiDatabase, DollarSign: FiDollarSign,
  Download: FiDownload, Edit3: FiEdit3, Eye: FiEye, EyeOff: FiEyeOff, FileText: FiFileText, Filter: FiFilter, Frown: FiFrown, Globe: FiGlobe,
  Grid: FiGrid, Home: FiHome, Inbox: FiInbox, Layers: FiLayers, Lock: FiLock, LogOut: FiLogOut, Mail: FiMail, MapPin: FiMapPin, Meh: FiMeh,
  PlayCircle: FiPlayCircle, Plus: FiPlus, RefreshCw: FiRefreshCw, Search: FiSearch, Shield: FiShield, Smile: FiSmile, Star: FiStar,
  Target: FiTarget, Trash2: FiTrash2, TrendingUp: FiTrendingUp, Upload: FiUpload, User: FiUser, Users: FiUsers, X: FiX, XCircle: FiXCircle,
  Zap: FiZap, ExternalLink: FiExternalLink,
};

export default function Icon({ n, s = 18, c = 'currentColor', w = 2, className }) {
  const C = MAP[n];
  if (!C) return null;
  return <C size={s} color={c} strokeWidth={w} className={className} aria-hidden="true" style={{ flex: 'none' }} />;
}
