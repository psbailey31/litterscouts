/**
 * Irish beaches with water quality data for map display
 * Source: EU Bathing Water Quality Directive 2024
 */

export interface BeachData {
  name: string;
  latitude: number;
  longitude: number;
  status: 'excellent' | 'good' | 'sufficient' | 'poor' | 'unknown';
  lastSampled: string;
  region: string;
}

export const IRISH_BEACHES: BeachData[] = [
  // Dublin
  { name: 'Dollymount Strand', latitude: 53.3667, longitude: -6.1667, status: 'excellent', lastSampled: '2024-08-15', region: 'Dublin' },
  { name: 'Sandymount Strand', latitude: 53.3333, longitude: -6.2167, status: 'good', lastSampled: '2024-08-15', region: 'Dublin' },
  { name: 'Seapoint', latitude: 53.2889, longitude: -6.1333, status: 'excellent', lastSampled: '2024-08-20', region: 'Dublin' },
  { name: 'Killiney Beach', latitude: 53.2667, longitude: -6.1000, status: 'excellent', lastSampled: '2024-08-20', region: 'Dublin' },
  
  // Wicklow
  { name: 'Bray South Beach', latitude: 53.2000, longitude: -6.1000, status: 'good', lastSampled: '2024-08-18', region: 'Wicklow' },
  { name: 'Greystones South Beach', latitude: 53.1500, longitude: -6.0667, status: 'excellent', lastSampled: '2024-08-18', region: 'Wicklow' },
  { name: 'Brittas Bay', latitude: 52.9167, longitude: -6.0333, status: 'excellent', lastSampled: '2024-08-22', region: 'Wicklow' },
  
  // Wexford
  { name: 'Curracloe Beach', latitude: 52.4167, longitude: -6.3667, status: 'excellent', lastSampled: '2024-08-25', region: 'Wexford' },
  { name: 'Rosslare Strand', latitude: 52.2500, longitude: -6.3333, status: 'excellent', lastSampled: '2024-08-25', region: 'Wexford' },
  
  // Waterford
  { name: 'Tramore Beach', latitude: 52.1667, longitude: -7.1500, status: 'excellent', lastSampled: '2024-08-28', region: 'Waterford' },
  { name: 'Bunmahon Beach', latitude: 52.1333, longitude: -7.4167, status: 'good', lastSampled: '2024-08-28', region: 'Waterford' },
  
  // Cork
  { name: 'Youghal Front Strand', latitude: 51.9500, longitude: -7.8500, status: 'excellent', lastSampled: '2024-09-01', region: 'Cork' },
  { name: 'Garryvoe Beach', latitude: 51.8500, longitude: -8.0000, status: 'excellent', lastSampled: '2024-09-01', region: 'Cork' },
  { name: 'Inchydoney Beach', latitude: 51.6333, longitude: -8.9167, status: 'excellent', lastSampled: '2024-09-05', region: 'Cork' },
  { name: 'Barleycove Beach', latitude: 51.4667, longitude: -9.7167, status: 'excellent', lastSampled: '2024-09-05', region: 'Cork' },
  
  // Kerry
  { name: 'Inch Beach', latitude: 52.1333, longitude: -10.0000, status: 'excellent', lastSampled: '2024-09-08', region: 'Kerry' },
  { name: 'Rossbeigh Beach', latitude: 52.0833, longitude: -9.9167, status: 'excellent', lastSampled: '2024-09-08', region: 'Kerry' },
  { name: 'Banna Strand', latitude: 52.3000, longitude: -9.8667, status: 'excellent', lastSampled: '2024-09-10', region: 'Kerry' },
  { name: 'Ballybunion Beach', latitude: 52.5167, longitude: -9.6667, status: 'excellent', lastSampled: '2024-09-10', region: 'Kerry' },
  
  // Clare
  { name: 'Kilkee Beach', latitude: 52.6833, longitude: -9.6500, status: 'excellent', lastSampled: '2024-09-12', region: 'Clare' },
  { name: 'Lahinch Beach', latitude: 52.9333, longitude: -9.3500, status: 'excellent', lastSampled: '2024-09-12', region: 'Clare' },
  { name: 'Spanish Point', latitude: 52.8500, longitude: -9.4333, status: 'good', lastSampled: '2024-09-12', region: 'Clare' },
  
  // Galway
  { name: 'Salthill Beach', latitude: 53.2583, longitude: -9.0833, status: 'good', lastSampled: '2024-09-15', region: 'Galway' },
  { name: 'Silverstrand Beach', latitude: 53.2333, longitude: -9.1167, status: 'excellent', lastSampled: '2024-09-15', region: 'Galway' },
  { name: 'Dog\'s Bay', latitude: 53.4000, longitude: -10.0000, status: 'excellent', lastSampled: '2024-09-18', region: 'Galway' },
  
  // Mayo
  { name: 'Keem Bay', latitude: 53.9667, longitude: -10.2000, status: 'excellent', lastSampled: '2024-09-20', region: 'Mayo' },
  { name: 'Mulranny Beach', latitude: 53.9000, longitude: -9.7833, status: 'excellent', lastSampled: '2024-09-20', region: 'Mayo' },
  
  // Sligo
  { name: 'Rosses Point', latitude: 54.3000, longitude: -8.5667, status: 'excellent', lastSampled: '2024-09-22', region: 'Sligo' },
  { name: 'Strandhill Beach', latitude: 54.2667, longitude: -8.6000, status: 'good', lastSampled: '2024-09-22', region: 'Sligo' },
  
  // Donegal
  { name: 'Bundoran Beach', latitude: 54.4833, longitude: -8.2833, status: 'excellent', lastSampled: '2024-09-25', region: 'Donegal' },
  { name: 'Rossnowlagh Beach', latitude: 54.5667, longitude: -8.3333, status: 'excellent', lastSampled: '2024-09-25', region: 'Donegal' },
  { name: 'Portsalon Beach', latitude: 55.1667, longitude: -7.7000, status: 'excellent', lastSampled: '2024-09-28', region: 'Donegal' },
  
  // Antrim
  { name: 'Portrush West Strand', latitude: 55.2000, longitude: -6.6667, status: 'excellent', lastSampled: '2024-09-30', region: 'Antrim' },
  { name: 'Ballycastle Beach', latitude: 55.2000, longitude: -6.2333, status: 'good', lastSampled: '2024-09-30', region: 'Antrim' },
  
  // Down
  { name: 'Tyrella Beach', latitude: 54.2833, longitude: -5.8167, status: 'excellent', lastSampled: '2024-10-02', region: 'Down' },
  { name: 'Murlough Beach', latitude: 54.2500, longitude: -5.8500, status: 'excellent', lastSampled: '2024-10-02', region: 'Down' },
];
