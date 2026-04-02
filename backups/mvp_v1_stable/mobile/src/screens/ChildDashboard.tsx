import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../store/AuthContext';

export default function ChildDashboard() {
  const { signOut, user } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel de Tarefas</Text>
      <Text style={styles.welcome}>E aí, {user?.name}!</Text>
      
      <View style={styles.content}>
         <Text>Suas tarefas gamificadas aparecerão aqui.</Text>
      </View>

      <Button title="Sair" onPress={signOut} color="#E53935" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F0F8FF', // Light blue gamified feel
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
  },
  welcome: {
    fontSize: 20,
    color: '#4A90E2',
    marginTop: 5,
    fontWeight: '600'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
