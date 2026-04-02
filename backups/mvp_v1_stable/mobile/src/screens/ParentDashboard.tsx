import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../store/AuthContext';

export default function ParentDashboard() {
  const { signOut, user } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel dos Pais</Text>
      <Text style={styles.welcome}>Olá, {user?.name}</Text>
      
      <View style={styles.content}>
         <Text>Visão geral dos filhos e tarefas aparecerá aqui.</Text>
      </View>

      <Button title="Sair" onPress={signOut} color="#E53935" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcome: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
