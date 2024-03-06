import time
from locust import HttpUser, task, between

class QuickstartUser(HttpUser):
    wait_time = between(1, 5)

    @task
    def general(self):
        self.client.get("/")
        time.sleep(1)
        for user_id in range(40, 60):
            self.client.get(f"/profile?userId={user_id}", name="/profile")
            time.sleep(1)

    @task(3)
    def get_entity(self):
        self.client.get("/")
        for item_id in range(40, 60):
            self.client.get(f"/entity?entityId={item_id}", name="/entity")
            time.sleep(1)

    def on_start(self):
        self.client.post("/login", json={"email":"dev@test.com", "password":"password"})