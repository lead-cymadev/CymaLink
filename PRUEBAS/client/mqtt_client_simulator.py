import paho.mqtt.client as mqtt
import json
import time
import random
import os
from datetime import datetime

# Configuración
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))

class MQTTSimulator:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.device_id = f"sensor_{random.randint(1000, 9999)}"
        
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"Simulador conectado al broker MQTT")
            # Suscribirse a comandos para este dispositivo
            client.subscribe(f"devices/{self.device_id}/commands")
            # Enviar estado online
            self.send_status("online")
        else:
            print(f"Error conectando: {rc}")
    
    def on_message(self, client, userdata, msg):
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            print(f"Comando recibido en {topic}: {payload}")
            
            # Simular respuesta a comando
            if "command" in payload:
                response = {
                    "device_id": self.device_id,
                    "command_received": payload["command"],
                    "status": "executed",
                    "timestamp": datetime.now().isoformat()
                }
                self.client.publish(f"devices/{self.device_id}/response", json.dumps(response))
                
        except Exception as e:
            print(f"Error procesando mensaje: {e}")
    
    def send_status(self, status):
        payload = {
            "device_id": self.device_id,
            "status": status,
            "timestamp": datetime.now().isoformat()
        }
        self.client.publish("devices/status", json.dumps(payload))
    
    def send_sensor_data(self):
        # Generar datos simulados
        data = {
            "device_id": self.device_id,
            "temperature": round(random.uniform(18.0, 30.0), 2),
            "humidity": round(random.uniform(40.0, 80.0), 2),
            "timestamp": datetime.now().isoformat()
        }
        
        self.client.publish("sensors/data", json.dumps(data))
        print(f"Datos enviados: {data}")
    
    def run(self):
        try:
            self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
            self.client.loop_start()
            
            print(f"Simulador iniciado para dispositivo: {self.device_id}")
            
            while True:
                # Enviar datos cada 10 segundos
                self.send_sensor_data()
                time.sleep(10)
                
        except KeyboardInterrupt:
            print("Deteniendo simulador...")
            self.send_status("offline")
            self.client.loop_stop()
            self.client.disconnect()
        except Exception as e:
            print(f"Error en el simulador: {e}")

if __name__ == "__main__":
    simulator = MQTTSimulator()
    simulator.run()