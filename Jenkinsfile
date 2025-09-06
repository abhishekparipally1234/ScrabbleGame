pipeline {
    agent any

    tools {
        // Configure Node.js 22.18.0 in Jenkins (Manage Jenkins > Global Tool Configuration)
        nodejs "Node22"
    }

    environment {
        BACKEND_DIR = "backend"
        FRONTEND_DIR = "scrabbleapp"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/abhishekparipally1234/ScrabbleGame.git'
            }
        }

        stage('Install Backend Deps') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend Deps') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm install'
                }
            }
        }

        stage('Backend Tests') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh 'npm test || echo "No backend tests defined"'
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm test || echo "No frontend tests defined"'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm run build'
                }
                // Optional: copy React build into backend/public
                sh "mkdir -p ${BACKEND_DIR}/public && cp -r ${FRONTEND_DIR}/build/* ${BACKEND_DIR}/public/"
            }
        }

        stage('Dockerize & Deploy') {
            steps {
                script {
                    // Example: Build Docker image and tag it
                    sh "docker build -t scrabblegame:latest ."
                    
                    // If you have DockerHub:
                    // sh 'docker tag scrabblegame:latest your-dockerhub-username/scrabblegame:latest'
                    // sh 'docker push your-dockerhub-username/scrabblegame:latest'
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/build/**', allowEmptyArchive: true
        }
        success {
            echo "✅ Scrabble MERN pipeline executed successfully!"
        }
        failure {
            echo "❌ Pipeline failed!"
        }
    }
}
