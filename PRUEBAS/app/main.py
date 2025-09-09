# Librerias necesarias para poder usar fastApi 
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paho.mqtt.client as mqtt
import json
import os
import asyncio
from typing import Dict, List
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración MQTT
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC_SENSORS = "sensors/data"
MQTT_TOPIC_COMMANDS = "devices/commands"

# FastAPI app
app = FastAPI(title="FastAPI MQTT Integration", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Almacén en memoria para los datos (en producción usar DB)
sensor_data: List[Dict] = []
connected_devices: List[str] = []

# Modelos Pydantic
class SensorData(BaseModel):
    device_id: str
    temperature: float
    humidity: float
    timestamp: str

class DeviceCommand(BaseModel):
    device_id: str
    command: str
    parameters: Dict = {}

# Cliente MQTT
mqtt_client = None

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("Conectado al broker MQTT")
        client.subscribe(MQTT_TOPIC_SENSORS)
        client.subscribe("devices/status")
    else:
        logger.error(f"Error conectando al broker MQTT: {rc}")

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = json.loads(msg.payload.decode())
        
        if topic == MQTT_TOPIC_SENSORS:
            # Guardar datos de sensores
            sensor_data.append(payload)
            # Mantener solo los últimos 100 registros
            if len(sensor_data) > 100:
                sensor_data.pop(0)
            logger.info(f"Datos recibidos del sensor: {payload}")
            
        elif topic == "devices/status":
            # Actualizar dispositivos conectados
            device_id = payload.get("device_id")
            status = payload.get("status")
            
            if status == "online" and device_id not in connected_devices:
                connected_devices.append(device_id)
            elif status == "offline" and device_id in connected_devices:
                connected_devices.remove(device_id)
                
    except Exception as e:
        logger.error(f"Error procesando mensaje MQTT: {e}")

def setup_mqtt():
    global mqtt_client
    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        logger.info(f"Cliente MQTT iniciado, conectando a {MQTT_BROKER}:{MQTT_PORT}")
    except Exception as e:
        logger.error(f"Error iniciando cliente MQTT: {e}")

# Eventos de FastAPI
@app.on_event("startup")
async def startup_event():
    setup_mqtt()

@app.on_event("shutdown")
async def shutdown_event():
    if mqtt_client:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()

# Rutas API
@app.get("/")
async def root():
    return {
        "message": "FastAPI + MQTT Integration API",
        "status": "running",
        "mqtt_broker": f"{MQTT_BROKER}:{MQTT_PORT}"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "mqtt_connected": mqtt_client.is_connected() if mqtt_client else False,
        "connected_devices": len(connected_devices)
    }

@app.get("/sensors/data")
async def get_sensor_data():
    """Obtener todos los datos de sensores"""
    return {
        "count": len(sensor_data),
        "data": sensor_data
    }

@app.get("/sensors/latest")
async def get_latest_sensor_data():
    """Obtener los últimos datos de cada sensor"""
    if not sensor_data:
        return {"message": "No hay datos disponibles"}
    
    # Agrupar por device_id y obtener el más reciente
    latest_by_device = {}
    for data in sensor_data:
        device_id = data.get("device_id")
        if device_id:
            latest_by_device[device_id] = data
    
    return latest_by_device

@app.get("/devices")
async def get_connected_devices():
    """Obtener lista de dispositivos conectados"""
    return {
        "count": len(connected_devices),
        "devices": connected_devices
    }

@app.get("/mqtt/publish/{topic}")
async def publish_test_message(topic: str, message: str = "Test message"):
    """Publicar mensaje de prueba en topic específico"""
    if mqtt_client and mqtt_client.is_connected():
        mqtt_client.publish(topic, message)
        return {"message": f"Mensaje publicado en {topic}", "content": message}
    else:
        return {"error": "Cliente MQTT no conectado"}

#Metodos 


@app.post("/sensors/simulate")
async def simulate_sensor_data(data: SensorData):
    """Simular envío de datos de sensor via MQTT"""
    if mqtt_client and mqtt_client.is_connected():
        payload = data.dict()
        mqtt_client.publish(MQTT_TOPIC_SENSORS, json.dumps(payload))
        return {"message": "Datos enviados al topic MQTT", "data": payload}
    else:
        return {"error": "Cliente MQTT no conectado"}

@app.post("/devices/command")
async def send_device_command(command: DeviceCommand):
    """Enviar comando a dispositivo via MQTT"""
    if mqtt_client and mqtt_client.is_connected():
        topic = f"devices/{command.device_id}/commands"
        payload = {
            "command": command.command,
            "parameters": command.parameters,
            "timestamp": command.timestamp if hasattr(command, 'timestamp') else None
        }
        mqtt_client.publish(topic, json.dumps(payload))
        return {
            "message": f"Comando enviado a {command.device_id}",
            "topic": topic,
            "payload": payload
        }
    else:
        return {"error": "Cliente MQTT no conectado"}
    