import { useAuth } from "../contexts/AuthContext";

export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission) => {
    return user?.permissions?.[permission] || false;
  };
  
  const isAdmin = () => {
    return user?.tipo_acesso === "administrador";
  };
  
  const isMarceneiro = () => {
    return user?.tipo_acesso === "marceneiro";
  };
  
  const isVisitante = () => {
    return user?.tipo_acesso === "visitante";
  };
  
  return {
    hasPermission,
    isAdmin,
    isMarceneiro,
    isVisitante,
    canManageOrders: hasPermission("can_manage_orders"),
    canEditOrders: hasPermission("can_edit_orders"),
    canDeleteOrders: hasPermission("can_delete_orders"),
    canManageMaterials: hasPermission("can_manage_materials"),
    canManageMarceneiros: hasPermission("can_manage_marceneiros"),
    canViewHistory: hasPermission("can_view_history"),
  };
};


