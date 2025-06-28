#!/bin/bash

# Script específico para configurar ProMail en daiscom
# Estructura: /home/daiscom/correopro.daiscom.com/public_html

set -e

echo "🚀 Configurando ProMail para daiscom..."
echo "🌐 Dominio: correopro.daiscom.com"
echo "📁 Estructura: /home/daiscom/correopro.daiscom.com/"
echo "=============================================="

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Este script debe ejecutarse como root (usa sudo)"
  exit 1
fi

USERNAME="daiscom"
DOMAIN="correopro.daiscom.com"
USER_HOME="/home/$USERNAME"
DOMAIN_PATH="$USER_HOME/$DOMAIN"

echo "👤 Usuario: $USERNAME"
echo "🌐 Dominio: $DOMAIN"
echo "📁 Ruta: $DOMAIN_PATH"
echo ""

# Actualizar sistema
echo "📦 Actualizando sistema..."
apt-get update && apt-get upgrade -y

# Instalar dependencias básicas
echo "📦 Instalando dependencias básicas..."
apt-get install -y curl wget git nginx certbot python3-certbot-nginx ufw

# Instalar Node.js 18.x
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Instalar PM2 para gestión de procesos
echo "📦 Instalando PM2..."
npm install -g pm2

# Verificar usuario daiscom
echo "👤 Verificando usuario $USERNAME..."
if ! id "$USERNAME" &>/dev/null; then
    echo "❌ El usuario $USERNAME no existe. Creándolo..."
    useradd -m -s /bin/bash "$USERNAME"
    usermod -aG sudo "$USERNAME"
    echo "✅ Usuario $USERNAME creado"
else
    echo "✅ Usuario $USERNAME existe"
fi

# Crear estructura de directorios específica para daiscom
echo "📁 Creando estructura de directorios..."
mkdir -p "$DOMAIN_PATH/public_html"
mkdir -p "$DOMAIN_PATH/logs"
mkdir -p "$DOMAIN_PATH/ssl"
mkdir -p "$DOMAIN_PATH/config"
mkdir -p "$DOMAIN_PATH/backups"
mkdir -p "$USER_HOME/logs"

# Cambiar propietario
chown -R "$USERNAME:$USERNAME" "$USER_HOME"

# Crear archivo de configuración del dominio
cat > "$DOMAIN_PATH/config/domain.conf" << EOF
# Configuración del dominio $DOMAIN
DOMAIN=$DOMAIN
USERNAME=$USERNAME
DOMAIN_PATH=$DOMAIN_PATH
BACKEND_PORT=3001
GITHUB_REPO=https://github.com/tu-usuario/promail.git
CREATED=$(date)
EOF

echo "✅ Estructura base creada!"
echo ""
echo "📋 Estructura creada:"
echo "  $DOMAIN_PATH/              # Raíz del dominio"
echo "  $DOMAIN_PATH/public_html/  # Archivos web públicos"
echo "  $DOMAIN_PATH/logs/         # Logs del dominio"
echo "  $DOMAIN_PATH/config/       # Configuración"
echo "  $DOMAIN_PATH/backups/      # Backups"
echo ""
echo "📋 Próximos pasos:"
echo "1. Clona tu repositorio: sudo bash deploy/clone-github.sh"
echo "2. Configura el dominio: sudo bash deploy/configure-daiscom.sh"
echo "3. Configura credenciales: sudo bash deploy/setup-credentials.sh"
echo "4. Inicia servicios: sudo bash deploy/start-daiscom.sh"