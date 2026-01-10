# Consensus

A comprehensive platform for building, analyzing, and managing distributed consensus mechanisms and blockchain systems.

## Project Purpose

Consensus is designed to provide developers and researchers with tools to understand, implement, and test various consensus algorithms used in blockchain and distributed systems. The project focuses on providing educational resources, reference implementations, and practical examples of different consensus mechanisms.

## Tech Stack

### Core Technologies
- **Language**: Python 3.9+
- **Framework**: Flask / FastAPI (REST API)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Message Queue**: RabbitMQ / Celery
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes (optional)

### Frontend
- **Framework**: React.js / Vue.js
- **State Management**: Redux / Vuex
- **Build Tool**: Webpack / Vite
- **Styling**: Tailwind CSS / Bootstrap

### Testing & Quality
- **Unit Testing**: pytest, Jest
- **Integration Testing**: pytest, Supertest
- **Code Coverage**: Coverage.py, Istanbul
- **Linting**: ESLint, Pylint, Black
- **Documentation**: Sphinx, JSDoc

### DevOps & Deployment
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Cloud**: AWS / GCP / Azure

## Architecture

### System Overview
The Consensus platform is built using a microservices architecture with the following core components:

```
┌─────────────────────────────────────────────────────┐
│                   Frontend Layer                     │
│        (React/Vue Dashboard & Web Interface)        │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                    API Gateway                       │
│              (REST/GraphQL Endpoints)               │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
┌───────▼──┐  ┌──────▼──┐  ┌────▼──────┐  ┌───▼────────┐
│ Consensus│  │ Network │  │ Validation│  │  Analytics │
│  Engine  │  │  Module │  │  Service  │  │  Service   │
└────┬─────┘  └────┬────┘  └────┬──────┘  └───┬────────┘
     │             │            │             │
┌────▼─────────────▼────────────▼─────────────▼────┐
│        Data Layer (PostgreSQL + Redis)            │
│              Message Queue (RabbitMQ)             │
└──────────────────────────────────────────────────┘
```

### Key Components

1. **Consensus Engine**: Core implementation of various consensus algorithms (PoW, PoS, PBFT, etc.)
2. **Network Module**: P2P networking, peer discovery, and communication
3. **Validation Service**: Transaction and block validation
4. **Analytics Service**: Performance metrics and analysis
5. **API Gateway**: Centralized entry point for all client requests
6. **Data Layer**: Persistent storage and caching

## Setup Instructions

### Prerequisites
- Python 3.9 or higher
- Node.js 16.x or higher
- Docker & Docker Compose
- PostgreSQL 12+
- Redis 6+

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/lcondliffe/Consensus.git
cd Consensus
```

#### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

#### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env.local

# Start development server
npm start
```

#### 4. Docker Compose Setup (Recommended)
```bash
# Start all services
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 5. Database Setup
```bash
# Create PostgreSQL database
createdb consensus_db

# Run migrations
python manage.py migrate

# Load initial data (optional)
python manage.py loaddata fixtures/initial_data.json
```

### Running Tests

```bash
# Backend tests
pytest tests/ -v --cov=app

# Frontend tests
cd frontend && npm test

# Integration tests
pytest tests/integration/ -v
```

### Running with Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/api/docs
```

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/consensus_db

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT & Security
SECRET_KEY=your-secret-key-here
JWT_EXPIRATION=3600

# API Settings
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# Blockchain Parameters
CONSENSUS_ALGORITHM=PoS
NETWORK_ID=1
MAX_BLOCK_SIZE=1MB
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Consensus
- `GET /api/consensus/algorithms` - List available algorithms
- `POST /api/consensus/simulate` - Run consensus simulation
- `GET /api/consensus/status` - Get current consensus status

### Blocks & Transactions
- `GET /api/blocks` - List blocks
- `POST /api/blocks/create` - Create new block
- `GET /api/transactions` - List transactions
- `POST /api/transactions/broadcast` - Broadcast transaction

### Analytics
- `GET /api/analytics/performance` - Performance metrics
- `GET /api/analytics/network` - Network statistics

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a Pull Request

Please ensure:
- Code follows PEP 8 (Python) and ESLint (JavaScript) standards
- All tests pass
- New features include test coverage
- Documentation is updated

## Development Workflow

### Code Standards
- Use Black for Python formatting
- Use Prettier for JavaScript formatting
- Maintain test coverage above 80%
- Write meaningful commit messages

### Git Workflow
```bash
# Create feature branch from main
git checkout -b feature/feature-name main

# Make changes and commit
git add .
git commit -m "feat: add new consensus algorithm"

# Push and create PR
git push origin feature/feature-name
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -h localhost

# Verify DATABASE_URL in .env
# Recreate database if needed
dropdb consensus_db
createdb consensus_db
python manage.py migrate
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Verify REDIS_URL in .env
# Restart Redis service
sudo systemctl restart redis
```

### Docker Issues
```bash
# Clean up Docker resources
docker-compose down -v
docker system prune -a

# Rebuild and restart
docker-compose up --build
```

## Performance Optimization

- Implement caching strategies with Redis
- Use connection pooling for database
- Enable gzip compression for API responses
- Implement rate limiting
- Use CDN for static assets
- Profile and optimize hot code paths

## Security

- Use environment variables for sensitive data
- Implement JWT authentication
- Enable HTTPS/TLS
- Use CORS properly
- Validate and sanitize all inputs
- Regular security audits
- Keep dependencies updated

## Roadmap

- [ ] Multi-consensus algorithm support
- [ ] Advanced network simulation
- [ ] Real-time performance dashboard
- [ ] Mobile application
- [ ] Mainnet deployment
- [ ] Advanced analytics
- [ ] Machine learning integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support & Contact

- **Issues**: [GitHub Issues](https://github.com/lcondliffe/Consensus/issues)
- **Discussions**: [GitHub Discussions](https://github.com/lcondliffe/Consensus/discussions)
- **Email**: your-email@example.com
- **Documentation**: [Wiki](https://github.com/lcondliffe/Consensus/wiki)

## Acknowledgments

- Consensus research community
- Open-source blockchain projects
- Contributors and testers

---

**Last Updated**: 2026-01-10
**Maintained by**: lcondliffe
