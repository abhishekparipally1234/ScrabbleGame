pipeline {
    agent any

    tools {
        nodejs "Node22"   // must match the name you configured in Jenkins
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

        stage('Install Backend') {
            steps {
                dir("backend") {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend') {
            steps {
                dir("scrabbleapp") {
                    sh 'npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir("scrabbleapp") {
                    sh 'npm run build || echo "⚠️ No build script found"'
                }
            }
        }
    }
}
