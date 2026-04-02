// Central type definitions for React Navigation
// Keeps all route params in one place

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ParentTabs: undefined;
  ChildTabs: undefined;
};

export type ParentTabParamList = {
  Dashboard: undefined;
  Tarefas: undefined;
  Relatorio: { childId?: string };
};

export type ParentStackParamList = {
  ParentMain: undefined;
  AddChild: undefined;
};

export type ChildTabParamList = {
  Inicio: undefined;
  Checklist: undefined;
};
