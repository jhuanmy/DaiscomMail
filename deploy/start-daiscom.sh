#!/bin/bash

# Script para iniciar servicios de ProMail para daiscom

USERNAME="daiscom"
DOMAIN="correopro.daiscom.com"
DOMAIN_PATH="/home/$USERNAME/$DOMAIN"

echo "🚀 Iniciando servicios de ProMail para daiscom..."
echo "🌐 Dominio: $DOMAIN"
echo "📁 Ruta: $DOMAIN_PATH"
echo "===================================="

if [ "$EUID" -ne 0 ]; then
  echo "❌ Este script debe ejecutarse como root"
  exit 1
fi

# Verificar que existe el proyecto
if [ ! -f "$DOMAIN_PATH/package.json" ]; then
  echo "❌ No se encontró el proyecto ProMail en $DOMAIN_PATH"
  echo "Ejecuta primero: sudo bash deploy/clone-github.sh"
  exit 1
fi

cd "$DOMAIN_PATH"

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
sudo -u "$USERNAME" npm install

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
sudo -u "$USERNAME" npm install
cd ..

# Construir frontend para producción
echo "🔨 Construyendo frontend..."
sudo -u "$USERNAME" npm run build

# Copiar archivos construidos a public_html
echo "📁 Copiando archivos a public_html..."
rm -rf "$DOMAIN_PATH/public_html/*"
cp -r "$DOMAIN_PATH/dist/"* "$DOMAIN_PATH/public_html/"
chown -R "$USERNAME:$USERNAME" "$DOMAIN_PATH/public_html"

# Crear configuración de PM2
cat > "$DOMAIN_PATH/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'promail-daiscom',
    script: 'backend/server.js',
    cwd: '$DOMAIN_PATH',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: '$DOMAIN_PATH/logs/pm2-combined.log',
    out_file: '$DOMAIN_PATH/logs/pm2-out.log',
    error_file: '$DOMAIN_PATH/logs/pm2-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
};
EOF

# Cambiar propietario de archivos
chown -R "$USERNAME:$USERNAME" "$DOMAIN_PATH"

# Configurar PM2 para el usuario si no está configurado
if ! sudo -u "$USERNAME" pm2 list &>/dev/null; then
  echo "⚙️ Configurando PM2 para usuario $USERNAME..."
  sudo -u "$USERNAME" pm2 startup
fi

# Iniciar con PM2 como usuario específico
echo "🚀 Iniciando backend con PM2..."
sudo -u "$USERNAME" pm2 start "$DOMAIN_PATH/ecosystem.config.js"
sudo -u "$USERNAME" pm2 save

# Crear script de gestión para daiscom
cat > "/home/$USERNAME/manage-promail.sh" << EOF
#!/bin/bash
# Script de gestión de ProMail para daiscom

DOMAIN_PATH="$DOMAIN_PATH"

case "\$1" in
  status)
    pm2 status
    ;;
  logs)
    pm2 logs promail-daiscom --lines 50
    ;;
  restart)
    pm2 restart promail-daiscom
    ;;
  stop)
    pm2 stop promail-daiscom
    ;;
  start)
    pm2 start promail-daiscom
    ;;
  update)
    echo "🔄 Actualizando ProMail desde GitHub..."
    cd \$DOMAIN_PATH
    git pull origin main
    npm install
    cd backend && npm install && cd ..
    npm run build
    cp -r dist/* public_html/
    pm2 restart promail-daiscom
    echo "✅ Actualización completada!"
    ;;
  backup)
    echo "💾 Creando backup..."
    cd /home/$USERNAME
    tar -czf "backups/promail-backup-\$(date +%Y%m%d-%H%M%S).tar.gz" $DOMAIN/
    echo "✅ Backup creado en ~/backups/"
    ;;
  *)
    echo "Uso: \$0 {status|logs|restart|stop|start|update|backup}"
    echo ""
    echo "Comandos disponibles:"
    echo "  status   - Ver estado del servicio"
    echo "  logs     - Ver logs en tiempo real"
    echo "  restart  - Reiniciar servicio"
    echo "  stop     - Detener servicio"
    echo "  start    - Iniciar servicio"
    echo "  update   - Actualizar desde GitHub y reiniciar"
    echo "  backup   - Crear backup completo"
    ;;
esac
EOF

chmod +x "/home/$USERNAME/manage-promail.sh"
chown "$USERNAME:$USERNAME" "/home/$USERNAME/manage-promail.sh"

# Crear script de actualización automática
cat > "/home/$USERNAME/auto-update.sh" << EOF
#!/bin/bash
# Script de actualización automática desde GitHub

cd $DOMAIN_PATH

# Verificar si hay cambios en GitHub
git fetch origin main
LOCAL=\$(git rev-parse HEAD)
REMOTE=\$(git rev-parse origin/main)

if [ "\$LOCAL" != "\$REMOTE" ]; then
    echo "\$(date): Nuevos cambios detectados, actualizando..." >> /home/$USERNAME/logs/auto-update.log
    /home/$USERNAME/manage-promail.sh update >> /home/$USERNAME/logs/auto-update.log 2>&1
else
    echo "\$(date): No hay cambios nuevos" >> /home/$USERNAME/logs/auto-update.log
fi
EOF

chmod +x "/home/$USERNAME/auto-update.sh"
chown "$USERNAME:$USERNAME" "/home/$USERNAME/auto-update.sh"

echo "✅ Servicios iniciados correctamente!"
echo ""
echo "📊 Estado de los servicios:"
sudo -u "$USERNAME" pm2 status
echo ""
echo "🌐 Tu ProMail está disponible en: https://$DOMAIN"
echo ""
echo "📋 Comandos útiles para daiscom:"
echo "  sudo -u daiscom ~/manage-promail.sh status    # Ver estado"
echo "  sudo -u daiscom ~/manage-promail.sh logs      # Ver logs"
echo "  sudo -u daiscom ~/manage-promail.sh restart   # Reiniciar"
echo "  sudo -u daiscom ~/manage-promail.sh update    # Actualizar desde GitHub"
echo "  sudo -u daiscom ~/manage-promail.sh backup    # Crear backup"
echo ""
echo "📁 Estructura de archivos:"
echo "  $DOMAIN_PATH/                 # Código fuente"
echo "  $DOMAIN_PATH/public_html/     # Archivos web"
echo "  $DOMAIN_PATH/logs/            # Logs"
echo "  $DOMAIN_PATH/config/          # Configuración"
echo "  $DOMAIN_PATH/backups/         # Backups"
echo ""
echo "🔄 Para configurar actualizaciones automáticas:"
echo "  sudo -u daiscom crontab -e"
echo "  # Agregar: 0 */6 * * * /home/daiscom/auto-update.sh"