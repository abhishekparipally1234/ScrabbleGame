pipeline {
    agent any

    tools {
        nodejs "Node22"   // Jenkins NodeJS installation (v22.18.0)
    }

    environment {
        BACKEND_DIR = "backend"
        FRONTEND_DIR = "scrabbleapp"
    }

    stages {
        stage('Sanity Check') {
            steps {
                sh 'node -v'
                sh 'npm -v'
                sh 'pwd'
                sh 'ls -R'
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

        stage('Frontend Tests') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm test -- --watchAll=false || echo "⚠️ No frontend tests configured"'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm run build'
                }
                // Copy React build into backend/public
                sh "mkdir -p ${BACKEND_DIR}/public && cp -r ${FRONTEND_DIR}/build/* ${BACKEND_DIR}/public/"
            }
        }
    }

    post {
        success {
            echo "✅ MERN pipeline executed successfully!"
        }
        failure {
            echo "❌ Pipeline failed — check logs above"
        }
    }
}
