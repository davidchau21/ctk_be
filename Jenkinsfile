// ─────────────────────────────────────────────────────────────────────────────
// Jenkinsfile — CryptoTracker Backend CI/CD Pipeline
// ─────────────────────────────────────────────────────────────────────────────
pipeline {
    agent any

    // ── Environment Variables ─────────────────────────────────────────────────
    environment {
        // Docker Hub (or private registry) image name & tag
        IMAGE_NAME    = "crypto-tracker-backend"
        IMAGE_TAG     = "${env.BUILD_NUMBER}"
        IMAGE_LATEST  = "${IMAGE_NAME}:latest"
        IMAGE_VERSIONED = "${IMAGE_NAME}:${IMAGE_TAG}"

        // Docker registry — set via Jenkins Credentials if using Docker Hub
        // DOCKER_CREDENTIALS = credentials('dockerhub-credentials')
        // REGISTRY           = "your-dockerhub-username"

        // Path to the backend subfolder inside the repo
        BACKEND_DIR   = "."

        // Node version (must match Dockerfile)
        NODE_VERSION  = "20"
    }

    // ── Pipeline Options ──────────────────────────────────────────────────────
    options {
        // Keep last 10 builds to save disk space
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Fail if pipeline takes longer than 30 minutes
        timeout(time: 30, unit: 'MINUTES')
        // Add timestamps to console output
        timestamps()
        // Skip default SCM checkout (we do it manually below)
        skipDefaultCheckout(false)
    }



    // ══════════════════════════════════════════════════════════════════════════
    // STAGES
    // ══════════════════════════════════════════════════════════════════════════
    stages {

        // ── Stage 1: Checkout ─────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo "📦 Checking out source code..."
                checkout scm
                script {
                    // Capture the short Git commit hash for tagging
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    echo "Git commit: ${env.GIT_COMMIT_SHORT}"
                }
            }
        }

        // ── Stage 2: Install Dependencies ────────────────────────────────────
        stage('Install Dependencies') {
            // Use Node.js tool configured in Jenkins Global Tool Configuration
            // If not configured, make sure Node.js is available in PATH
            steps {
                dir("${BACKEND_DIR}") {
                    echo "📦 Installing Node.js dependencies..."
                    sh 'node --version'
                    sh 'yarn --version'
                    sh 'yarn install --frozen-lockfile'
                }
            }
        }

        // ── Stage 3: Lint ─────────────────────────────────────────────────────
        stage('Lint') {
            steps {
                dir("${BACKEND_DIR}") {
                    echo "🔍 Running ESLint..."
                    sh 'yarn lint || true'
                    // Use '|| true' so lint warnings don't fail the build.
                    // Remove '|| true' to make lint failures block the pipeline.
                }
            }
        }

        // ── Stage 4: Unit Tests ───────────────────────────────────────────────
        stage('Unit Tests') {
            steps {
                dir("${BACKEND_DIR}") {
                    echo "🧪 Running unit tests..."
                    sh 'yarn test --passWithNoTests'
                }
            }
            post {
                always {
                    // Publish JUnit test results if jest-junit reporter is used
                    // junit "${BACKEND_DIR}/test-results/**/*.xml"
                    echo "Test stage completed."
                }
            }
        }

        // ── Stage 5: Build TypeScript ─────────────────────────────────────────
        stage('Build') {
            steps {
                dir("${BACKEND_DIR}") {
                    echo "🔨 Compiling TypeScript..."
                    sh 'yarn build'
                }
            }
        }

        // ── Stage 6: Docker Build ─────────────────────────────────────────────
        stage('Docker Build') {
            steps {
                dir("${BACKEND_DIR}") {
                    echo "🐳 Building Docker image: ${IMAGE_VERSIONED}"
                    sh """
                        docker build \
                          --target production \
                          --build-arg NODE_ENV=production \
                          -t ${IMAGE_VERSIONED} \
                          -t ${IMAGE_LATEST} \
                          -t ${IMAGE_NAME}:${env.GIT_COMMIT_SHORT} \
                          .
                    """
                }
            }
        }

        // ── Stage 7: Docker Push (optional) ──────────────────────────────────
        // Uncomment and configure REGISTRY + DOCKER_CREDENTIALS to push to
        // Docker Hub or a private registry.
        //
        // stage('Docker Push') {
        //     when {
        //         branch 'main'
        //     }
        //     steps {
        //         echo "📤 Pushing image to registry..."
        //         withDockerRegistry([credentialsId: 'dockerhub-credentials', url: '']) {
        //             sh "docker tag ${IMAGE_LATEST} ${REGISTRY}/${IMAGE_LATEST}"
        //             sh "docker push ${REGISTRY}/${IMAGE_LATEST}"
        //             sh "docker tag ${IMAGE_VERSIONED} ${REGISTRY}/${IMAGE_VERSIONED}"
        //             sh "docker push ${REGISTRY}/${IMAGE_VERSIONED}"
        //         }
        //     }
        // }

        // ── Stage 8: Deploy (Docker Compose) ─────────────────────────────────
        stage('Deploy') {
            when {
                // Only deploy from main/master branch
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                echo "🚀 Deploying backend with Docker Compose..."
                // Run from project root (one level above backend/)
                sh """
                    cd ${WORKSPACE}

                    # Ensure .env exists (Jenkins should provide secrets via credentials)
                    if [ ! -f .env ]; then
                        echo "⚠️  No .env file found — copying .env.example"
                        cp .env.example .env
                    fi

                    # Pull/rebuild and restart only the backend service
                    docker compose up -d --build --no-deps backend
                """
            }
        }

        // ── Stage 9: Health Check ─────────────────────────────────────────────
        stage('Health Check') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                echo "❤️  Waiting for backend to become healthy..."
                sh """
                    RETRIES=15
                    COUNT=0
                    until wget -qO- http://localhost:3000/api/v1/health > /dev/null 2>&1; do
                        COUNT=\$((COUNT+1))
                        if [ \$COUNT -ge \$RETRIES ]; then
                            echo "❌ Health check failed after \${RETRIES} retries"
                            exit 1
                        fi
                        echo "⏳ Waiting... (\${COUNT}/\${RETRIES})"
                        sleep 6
                    done
                    echo "✅ Backend is healthy!"
                """
            }
        }

    } // end stages

    // ══════════════════════════════════════════════════════════════════════════
    // POST-PIPELINE NOTIFICATIONS
    // ══════════════════════════════════════════════════════════════════════════
    post {
        success {
            echo "✅ Pipeline succeeded! Image: ${IMAGE_VERSIONED}"
            // Add Slack/email notification here, e.g.:
            // slackSend channel: '#devops', message: "✅ Build #${BUILD_NUMBER} succeeded!"
        }
        failure {
            echo "❌ Pipeline failed at stage: ${currentBuild.result}"
            // slackSend channel: '#devops', message: "❌ Build #${BUILD_NUMBER} FAILED!"
        }
        always {
            // Clean up dangling Docker images to save disk space
            sh 'docker image prune -f || true'
            echo "🧹 Cleanup done."
        }
        unstable {
            echo "⚠️ Pipeline unstable — check test results."
        }
    }
}
