import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Search, Edit, Trash2, Eye, TrendingUp, TrendingDown,
  UserPlus, MoreVertical, Key, Power, PowerOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  status: string;
  avatar_url: string | null;
  created_at: string;
  user_id?: string | null;
  latestWeight?: number;
  latestBmi?: number;
  weightChange?: number;
  birth_date?: string;
  height?: number;
  medical_notes?: string;
}

interface PatientManagementProps {
  patients: Patient[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => void;
}

const PatientManagement = ({ patients, searchQuery, setSearchQuery, onRefresh }: PatientManagementProps) => {
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    birth_date: "",
    height: "",
    medical_notes: "",
    status: "active"
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      gender: "",
      birth_date: "",
      height: "",
      medical_notes: "",
      status: "active"
    });
  };

  const handleAddPatient = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("patients")
        .insert({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          gender: formData.gender || null,
          birth_date: formData.birth_date || null,
          height: formData.height ? parseFloat(formData.height) : null,
          medical_notes: formData.medical_notes || null,
          status: formData.status
        });

      if (error) throw error;

      toast.success("Paciente adicionado com sucesso!");
      setIsAddDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("Error adding patient:", error);
      toast.error("Erro ao adicionar paciente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPatient = async () => {
    if (!selectedPatient || !formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          gender: formData.gender || null,
          birth_date: formData.birth_date || null,
          height: formData.height ? parseFloat(formData.height) : null,
          medical_notes: formData.medical_notes || null,
          status: formData.status
        })
        .eq("id", selectedPatient.id);

      if (error) throw error;

      toast.success("Paciente atualizado com sucesso!");
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedPatient(null);
      onRefresh();
    } catch (error) {
      console.error("Error updating patient:", error);
      toast.error("Erro ao atualizar paciente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", selectedPatient.id);

      if (error) throw error;

      toast.success("Paciente removido com sucesso!");
      setDeleteDialogOpen(false);
      setSelectedPatient(null);
      onRefresh();
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast.error("Erro ao remover paciente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (patient: Patient) => {
    const newStatus = patient.status === "active" ? "inactive" : "active";
    
    try {
      const { error } = await supabase.from("patients")
        .update({ status: newStatus })
        .eq("id", patient.id);

      if (error) throw error;

      toast.success(`Paciente ${newStatus === "active" ? "ativado" : "desativado"} com sucesso!`);
      onRefresh();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Erro ao alterar status do paciente");
    }
  };

  const handleChangePassword = async () => {
    if (!selectedPatient?.user_id) {
      toast.error("Este paciente não possui conta de usuário vinculada");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-user-password", {
        body: { userId: selectedPatient.user_id, newPassword }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Senha alterada com sucesso!");
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setSelectedPatient(null);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao alterar senha");
    } finally {
      setIsLoading(false);
    }
  };

  const openPasswordDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordDialogOpen(true);
  };

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      email: patient.email || "",
      phone: patient.phone || "",
      gender: patient.gender || "",
      birth_date: patient.birth_date || "",
      height: patient.height?.toString() || "",
      medical_notes: patient.medical_notes || "",
      status: patient.status
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl font-serif">Gerenciar Pacientes</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary rounded-xl" onClick={resetForm}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Paciente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Paciente</DialogTitle>
                </DialogHeader>
                <PatientForm 
                  formData={formData} 
                  setFormData={setFormData}
                  onSubmit={handleAddPatient}
                  isLoading={isLoading}
                  submitLabel="Adicionar"
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum paciente encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={patient.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {patient.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{patient.name}</h3>
                      <Badge variant={patient.status === "active" ? "default" : "secondary"}>
                        {patient.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {patient.email || "Sem email"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {patient.latestWeight && (
                    <div className="text-right hidden md:block">
                      <p className="text-sm text-muted-foreground">Peso Atual</p>
                      <p className="font-medium">{patient.latestWeight?.toFixed(1)} kg</p>
                    </div>
                  )}
                  
                  {patient.weightChange !== undefined && patient.weightChange !== 0 && (
                    <div className="text-right hidden md:block">
                      <p className="text-sm text-muted-foreground">Evolução</p>
                      <p className={`font-medium flex items-center gap-1 ${
                        patient.weightChange < 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {patient.weightChange < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <TrendingUp className="w-4 h-4" />
                        )}
                        {patient.weightChange > 0 ? "+" : ""}{patient.weightChange?.toFixed(1)} kg
                      </p>
                    </div>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/paciente/${patient.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(patient)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openPasswordDialog(patient)}>
                        <Key className="w-4 h-4 mr-2" />
                        Alterar Senha
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(patient)}>
                        {patient.status === "active" ? (
                          <>
                            <PowerOff className="w-4 h-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedPatient(patient);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          <PatientForm 
            formData={formData} 
            setFormData={setFormData}
            onSubmit={handleEditPatient}
            isLoading={isLoading}
            submitLabel="Salvar"
          />
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Alterar senha do paciente {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="gradient-primary"
            >
              {isLoading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedPatient?.name}? 
              Esta ação não pode ser desfeita e todos os dados associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePatient}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

interface PatientFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    gender: string;
    birth_date: string;
    height: string;
    medical_notes: string;
    status: string;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}

const PatientForm = ({ formData, setFormData, onSubmit, isLoading, submitLabel }: PatientFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="rounded-xl"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="gender">Sexo</Label>
          <Select 
            value={formData.gender} 
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="birth_date">Data Nascimento</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            className="rounded-xl"
            min="100"
            max="250"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="medical_notes">Observações Médicas</Label>
        <Textarea
          id="medical_notes"
          value={formData.medical_notes}
          onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
          className="rounded-xl resize-none"
          rows={3}
        />
      </div>

      <Button 
        onClick={onSubmit} 
        className="w-full gradient-primary rounded-xl"
        disabled={isLoading}
      >
        {isLoading ? "Salvando..." : submitLabel}
      </Button>
    </div>
  );
};

export default PatientManagement;