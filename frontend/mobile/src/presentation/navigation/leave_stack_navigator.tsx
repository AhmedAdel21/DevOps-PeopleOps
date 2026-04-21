import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { LeaveStackParamList } from './types';
import { LeaveScreen } from '@/presentation/screens/leave';
import { NewVacationRequestScreen } from '@/presentation/screens/leave/new_vacation_request_screen';
import { NewPermissionRequestScreen } from '@/presentation/screens/leave/new_permission_request_screen';

const LeaveStack = createNativeStackNavigator<LeaveStackParamList>();

export const LeaveStackNavigator: React.FC = () => (
  <LeaveStack.Navigator
    screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
  >
    <LeaveStack.Screen name="LeaveLanding" component={LeaveScreen} />
    <LeaveStack.Screen name="NewVacationRequest" component={NewVacationRequestScreen} />
    <LeaveStack.Screen name="NewPermissionRequest" component={NewPermissionRequestScreen} />
  </LeaveStack.Navigator>
);
