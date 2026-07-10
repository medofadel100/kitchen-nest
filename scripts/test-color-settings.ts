import { getDefaultColorForUnitType, getDefaultDoorColorForUnitType } from '../src/store/projectStore';
import { ProjectSettings } from '../src/types';

const settings: ProjectSettings = {
  defaultHingeId: 'hinge',
  defaultDrawerRunnerId: 'drawer',
  defaultHandleId: 'handle',
  defaultBaseHeightMm: 900,
  defaultBaseDepthMm: 600,
  defaultWallElevationMm: 1500,
  defaultWallHeightMm: 700,
  defaultWallDepthMm: 350,
  defaultLoftElevationMm: 2200,
  defaultLoftHeightMm: 400,
  defaultLoftDepthMm: 600,
  defaultMaterialId: 'mat',
  defaultDoorMaterialId: 'door_mat',
  defaultBaseColor: '#D4B896',
  defaultWallColor: '#6B7280',
  defaultTallColor: '#A16207',
  defaultLoftColor: '#4B5563',
  defaultColorHex: '#D4B896',
  defaultBaseDoorColor: '#FFFFFF',
  defaultWallDoorColor: '#F5F5F5',
  defaultTallDoorColor: '#E5E7EB',
  defaultLoftDoorColor: '#EDEDED',
};

const body = getDefaultColorForUnitType('base', settings);
const wallDoor = getDefaultDoorColorForUnitType('wall', settings);
const loftBody = getDefaultColorForUnitType('loft', settings);

if (body !== '#D4B896' || wallDoor !== '#F5F5F5' || loftBody !== '#4B5563') {
  throw new Error(`Unexpected colors: body=${body}, wallDoor=${wallDoor}, loftBody=${loftBody}`);
}

console.log('Color settings helpers OK');
