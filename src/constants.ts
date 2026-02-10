import type { RecentScan, TopFile } from './types';

export const MOCK_RECENT_SCANS: RecentScan[] = [
  { id: '1', path: 'C:\\Users\\Documents', size: '12.4 GB', time: '2 hours ago', icon: 'folder' },
  { id: '2', path: 'D:\\Projects', size: '45.2 GB', time: 'Yesterday', icon: 'folder_special' },
  { id: '3', path: 'E:\\Media', size: '234.1 GB', time: '3 days ago', icon: 'perm_media' },
];

export const MOCK_TOP_FILES: TopFile[] = [
  { id: '1', name: 'project_render_final.mp4', size: '13.2 GB', path: '/Media/Videos', date: '2 days ago', icon: 'movie' },
  { id: '2', name: 'database_backup.sql', size: '8.5 GB', path: '/Projects/DB', date: 'Yesterday', icon: 'storage' },
  { id: '3', name: 'system_cache.bin', size: '5.2 GB', path: '/System/Temp', date: '1 week ago', icon: 'memory' },
  { id: '4', name: 'raw_photos_archive.zip', size: '4.8 GB', path: '/Media/Photos', date: '3 days ago', icon: 'photo_library' },
  { id: '5', name: 'vm_snapshot.vhd', size: '3.1 GB', path: '/VMs', date: 'Today', icon: 'computer' },
];

export const FORMAT_SIZE = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, index)).toFixed(2)) + ' ' + sizes[index];
};

export const DEFAULT_SETTINGS = {
  theme: 'light' as const,
  showEmptyFolders: false,
  followSymbolicLinks: false,
  highPrecisionSizes: true,
  scanThreads: 4,
  maxDepth: 32,
  includeHidden: false,
  includeSystemDirs: false,
};
