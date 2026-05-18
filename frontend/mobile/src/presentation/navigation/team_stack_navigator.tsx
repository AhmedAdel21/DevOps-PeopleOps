import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TeamStackParamList } from './types';
import { TeamScreen } from '@/presentation/screens/team';
import { ApprovalDetailScreen } from '@/presentation/screens/team/approval_detail_screen';

const TeamStack = createNativeStackNavigator<TeamStackParamList>();

/**
 * Team tab stack: the landing screen (Attendance + Approvals segments)
 * and the pushed Approval Detail screen (designs ynfPj / UirUR).
 */
export const TeamStackNavigator: React.FC = () => (
  <TeamStack.Navigator
    screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
  >
    <TeamStack.Screen name="TeamLanding" component={TeamScreen} />
    <TeamStack.Screen
      name="ApprovalDetail"
      component={ApprovalDetailScreen}
    />
  </TeamStack.Navigator>
);
