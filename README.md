[繁體中文](#繁體中文) | [English](#english)

---

<a name="繁體中文"></a>

## 目錄
*   [概述](#概述)
*   [主要功能](#主要功能)
*   [技術棧](#技術棧)
    *   [前端](#前端)
    *   [後端](#後端)
    *   [部署與基礎設施](#部署與基礎設施)

## 概述

[**CODE NOW**](https://codenow.rj-tw.com/) 是一個即時協作的程式碼編輯器，旨在提供一個多使用者能夠同時編輯程式碼的平台。支援 `JavaScript` 和 `Python` 兩種語言，並能即時同步所有參與者的程式碼變更、游標位置及選取範圍，提供流暢的協作體驗。

## 主要功能

*   **即時程式碼同步**：多個使用者可以同時編輯同一份程式碼，所有變更即時反映。
*   **多語言支援**：內建 `JavaScript` 和 `Python` 程式碼編輯器，可隨時切換。
*   **協作游標與選取**：清晰顯示其他協作者的游標位置和選取範圍，提升協作效率。
*   **容器化部署**：利用 `Docker` 和 `Docker Compose` 實現跨平台部署與環境一致性。
*   **安全連線**：透過 `Nginx` 和 `Certbot` 提供 HTTPS 安全連線。

## 技術棧

本專案採用現代化的全端技術棧，確保高效能、可擴展性和易於維護性。

### 前端

*   **框架**：[React](https://react.dev/) (`TypeScript`)
*   **建置工具**：[Vite](https://vitejs.dev/)
*   **程式碼編輯器**：[@uiw/react-codemirror](https://uiwjs.github.io/react-codemirror/) (基於 `CodeMirror 6`)
*   **即時通訊**：[Socket.IO Client](https://socket.io/docs/v4/client-api/)
*   **樣式**：[Tailwind CSS](https://tailwindcss.com/) (搭配 `PostCSS` 和 `Autoprefixer`)

### 後端

*   **運行環境**：[Node.js](https://nodejs.org/)
*   **框架**：[Express.js](https://expressjs.com/) (`TypeScript`)
*   **即時通訊**：[Socket.IO](https://socket.io/docs/v4/server-api/)

### 部署與基礎設施

*   **部署環境**：部署於 [AWS EC2](https://aws.amazon.com/ec2/) 實例上，利用其彈性計算能力運行容器化應用。
*   **容器化**：[Docker](https://www.docker.com/)
*   **多容器編排**：[Docker Compose](https://docs.docker.com/compose/)
*   **反向代理/Web 伺服器**：[Nginx](https://nginx.org/)
*   **SSL 憑證管理**：[Certbot](https://certbot.eff.org/) (Let's Encrypt)
*   **自動化部署**：[GitHub Actions](https://docs.github.com/en/actions)

---

<a name="english"></a>

## Table of Contents
*   [Overview](#overview)
*   [Key Features](#key-features)
*   [Technology Stack](#technology-stack)
    *   [Frontend](#frontend)
    *   [Backend](#backend)
    *   [Deployment & Infrastructure](#deployment--infrastructure)

## Overview

[**CODE NOW**](https://codenow.rj-tw.com/) is a real-time collaborative code editor designed to provide a platform where multiple users can simultaneously edit code. It supports both `JavaScript` and `Python`, and instantly synchronizes all participants' code changes, cursor positions, and selection ranges, offering a seamless collaborative experience.

## Key Features

*   **Real-time Code Synchronization**: Multiple users can edit the same code simultaneously, with all changes reflected instantly.
*   **Multi-language Support**: Built-in `JavaScrip`t and `Python` code editors, with the ability to switch between languages at any time.
*   **Collaborative Cursors and Selections**: Clearly displays other collaborators' cursor positions and selection ranges, enhancing teamwork efficiency.
*   **Containerized Deployment**: Leverages `Docke`r and `Docker Compose` for cross-platform deployment and environment consistency.
*   **Secure Connection**: Provides HTTPS secure connections via `Nginx` and `Certbot`.

## Technology Stack

This project utilizes a modern full-stack technology stack, ensuring high performance, scalability, and maintainability.

### Frontend

*   **Framework**: [React](https://react.dev/) (`TypeScript`)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Code Editor**: [@uiw/react-codemirror](https://uiwjs.github.io/react-codemirror/) (based on `CodeMirror 6`)
*   **Real-time Communication**: [Socket.IO Client](https://socket.io/docs/v4/client-api/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (with `PostCSS` and `Autoprefixer`)

### Backend

*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/) (`TypeScript`)
*   **Real-time Communication**: [Socket.IO](https://socket.io/docs/v4/server-api/)

### Deployment & Infrastructure

*   **Deployment Environment**: Deployed on [AWS EC2](https://aws.amazon.com/ec2/) instances, leveraging its elastic compute capabilities to run containerized applications.
*   **Containerization**: [Docker](https://www.docker.com/)
*   **Multi-container Orchestration**: [Docker Compose](https://docs.docker.com/compose/)
*   **Reverse Proxy/Web Server**: [Nginx](https://nginx.org/)
*   **SSL Certificate Management**: [Certbot](https://certbot.eff.org/) (Let's Encrypt)
*   **Automated Deployment**: [GitHub Actions](https://docs.github.com/en/actions)