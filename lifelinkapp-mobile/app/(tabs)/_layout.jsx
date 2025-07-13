import { Text, View, Image, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { icons } from '../../constants'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'react-native'

const TabIcon = ({ icon, color, name, focused }) => {
    color = focused ? '#C65D00' : '#D1D5DB';
    return (
        <View>
            <Image
                source={icon}
                style={styles.icon}
                tintColor={color}
                resizeMode="contain"
            />
        </View>
    )
}

const TabLayout = () => {
    return (    
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="orange" />
            <Tabs
                screenOptions={{
                tabBarStyle: {
                    backgroundColor: '#111827',
                    paddingTop: 0,
                    paddingBottom: 0,
                    height: 60,
                },
            }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.home}
                                color={color}
                                name="Home"
                                focused={focused}
                            />
                        ),
                        tabBarLabel: ({ focused }) => (
                            <Text style={{ color: focused ? '#C65D00' : '#D1D5DB', fontSize: 12 }}>
                                Home
                            </Text>
                        ),
                    }}
                />

                <Tabs.Screen
                    name="search"
                    options={{
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.search}
                                color={color}
                                name="Search"
                                focused={focused}
                            />
                        ),
                        tabBarLabel: ({ focused }) => (
                            <Text style={{ color: focused ? '#C65D00' : '#D1D5DB', fontSize: 12 }}>
                                Search
                            </Text>
                        ),
                    }}
                />

                <Tabs.Screen
                    name="notification"
                    options={{
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.notifBell}
                                color={color}
                                name="Notification"
                                focused={focused}
                            />
                        ),
                        tabBarLabel: ({ focused }) => (
                            <Text style={{ color: focused ? '#C65D00' : '#D1D5DB', fontSize: 12 }}>
                                Notification
                            </Text>
                        ),
                    }}
                />

                <Tabs.Screen
                    name="contacts"
                    options={{
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.phone}
                                color={color}
                                name="Contacts"
                                focused={focused}
                            />
                        ),
                        tabBarLabel: ({ focused }) => (
                            <Text style={{ color: focused ? '#C65D00' : '#D1D5DB', fontSize: 12 }}>
                                Contacts
                            </Text>
                        ),
                    }}
                />
            </Tabs>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#F9FAFB',
        flex: 1,
        height: '100%',
    },
    icon: {
        width: 20,
        height: 20,
    },
});

export default TabLayout