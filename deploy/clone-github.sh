#!/bin/bash

# Script para clonar el repositorio de GitHub en la estructura de daiscom

USERNAME="daiscom"
DOMAIN="correopro.daiscom.com"
DOMAIN_PATH="/home/$USERNAME/$DOMAIN"

echo "📥 Clonando repositorio de ProMail desde GitHub..."
echo "📁 Destino: $DOMAIN_PATH"
echo "=============================================="

if [ "$EUID" -ne 0 ]; then
  echo "❌ Este script debe ejecutarse como root"
  exit 1
fi

# Verificar que existe la estructura
if [ ! -d "$DOMAIN_PATH" ]; then
  echo "❌ No existe la estructura del dominio en $DOMAIN_PATH"
  echo "Ejecuta primero: sudo bash deploy/setup-daiscom.sh"
  exit 1
fi

# Solicitar URL del repositorio
echo "🔗 Configuración del repositorio GitHub:"
read -p "URL del repositorio [https://github.com/tu-usuario/promail.git]: " REPO_URL
REPO_URL=${REPO_URL:-"https://github.com/tu-usuario/promail.git"}

echo "📥 Clonando desde: $REPO_URL"

# Cambiar al directorio del dominio
cd "$DOMAIN_PATH"

# Si ya existe contenido, hacer backup
if [ "$(ls -A . 2>/dev/null)" ]; then
  echo "⚠️ El directorio no está vacío. Creando backup..."
  sudo -u "$USERNAME" mkdir -p backups
  sudo -u "$USERNAME" tar -czf "backups/backup-before-clone-$(date +%Y%m%d-%H%M%S).tar.gz" . --exclude=backups
  echo "✅ Backup creado en backups/"
  
  # Limpiar directorio (excepto backups)
  find . -mindepth 1 -maxdepth 1 ! -name 'backups' -exec rm -rf {} +
fi

# Clonar repositorio
echo "📥 Clonando repositorio..."
sudo -u "$USERNAME" git clone "$REPO_URL" .

# Verificar que se clonó correctamente
if [ ! -f "package.json" ]; then
  echo "❌ Error: No se encontró package.json. Verifica la URL del repositorio."
  exit 1
fi

# Configurar git para futuras actualizaciones
sudo -u "$USERNAME" git config pull.rebase false

# Guardar configuración del repositorio
cat > "$DOMAIN_PATH/config/github.conf" << EOF
# Configuración GitHub para $DOMAIN
REPO_URL=$REPO_URL
CLONED=$(date)
BRANCH=$(sudo -u "$USERNAME" git branch --show-current)
EOF

chown "$USERNAME:$USERNAME" "$DOMAIN_PATH/config/github.conf"

echo "✅ Repositorio clonado exitosamente!"
echo ""
echo "📋 Información del repositorio:"
echo "  URL: $REPO_URL"
echo "  Rama: $(sudo -u "$USERNAME" git branch --show-current)"
echo "  Último commit: $(sudo -u "$USERNAME" git log -1 --pretty=format:'%h - %s (%cr)')"
echo ""
echo "📋 Próximo paso:"
echo "  sudo bash deploy/configure-daiscom.sh"