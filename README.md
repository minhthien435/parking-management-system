# eParking Management System
> **eParking Management System** - A smart and automated parking management system.
>
> - Live demo link: https://eparking-v1.vercel.app/

---

## Key Features

The eParking system supports comprehensive parking management workflows from system administration down to casual visitors, featuring key functions:

* **Automatic Number Plate Recognition (ANPR)**: An integrated AI module combining the YOLOv8 model and EasyOCR library to detect vehicles, localize license plates, and extract registration text in real-time at entry/exit barrier gates.
* **Quick Pay**: Allows casual visitors to quickly look up parking information via license plate or ticket code without signing in. Supports instant online payment through integration with the VietQR gateway (PayOS) or a test Mock Payment system.
* **Advance Booking**: Registered users can search for vacant slots, book prior to arrival, filter for specialized slots (such as EV Charging or Accessible/Handicapped parking), and receive navigation directions to their assigned spot.
* **Visual Floor Overview & Slot Layout**: Interactive zone layout displaying real-time status for every parking slot:
    * *Available*: Green
    * *Occupied*: Red
    * *Reserved/Booked*: Orange
    * *Maintenance*: Grey
* **Staff Gate Control**: Gate operator interface comparing entry and exit vehicle photos side-by-side, verifying ticket status, and granting manual or automated barrier release approvals.
* **Incident Management**: Workflow for submitting incident reports (lost tickets, vehicle damage, technical faults) from customers or staff, paired with a manager dashboard for review and compensation processing.
* **Dynamic Pricing Policy**: Flexible pricing rule configuration based on vehicle type (motorcycles, cars, electric vehicles) and parking type (hourly block rates for casual parking or daily rates for reservations).
* **Security & System Monitoring**:
    * Fine-grained Role-Based Access Control (RBAC): *SystemAdmin, ParkingManager, ParkingStaff, ParkingUser*.
    * Secure endpoint access control using JWT Bearer authentication.
    * Integrated IP Filtering and Rate Limiting to mitigate Spam and DDoS attacks.
    * Comprehensive Audit Logging tracking all operational and user activities.

---

## Tech Stack

* **Programming Languages:** C# (.NET 8.0/9.0), JavaScript (React ES6+), Python 3.9+
* **Backend:** ASP.NET Core Web API, Entity Framework Core, JWT Bearer Authentication, MailKit, PayOS SDK (VietQR Gateway)
* **Frontend:** React (Vite), Tailwind CSS (Aesthetics UI), Lucide React (Icons), Axios, React Router DOM
* **AI Module (ANPR):** OpenCV, YOLOv8 (Ultralytics), EasyOCR, PyTorch, SORT Tracker (Object tracking)
* **Database:** MySQL Server
* **Development & Deployment:** Docker & Docker Compose, Swagger (OpenAPI Document), Git
