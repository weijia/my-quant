# my-quant

## Prompt for the chart
我要画一个github中的readme的图，它是一个股票量化交易平台
它包含多个web在线股票交易平台，这些平台所对应的agent，以及我自己的多个dashboard
对于实时股票价格数据，条件单以及网格交易创建请求，它通过中间层通过加密及重试等，发送到底层mqtt或者其他消息平台发送接收消息来更新数据
对于并不是那么实时的数据，比如每日开盘时的持仓，已设定条件单，网格交易订单等，它通过webdav等远程存储空间进行同步及更新
请帮我写一个这样的图

```mermaid
graph TD
    %% 用户交互层
    subgraph UI ["💻 用户界面与面板"]
        direction LR
        Platforms["🌐 Web 股票交易平台 (A/B/C)"]
        Dashboards["📊 个人多维 Dashboards"]
    end

    %% 代理层
    subgraph Agents ["🤖 代理层"]
        A_Group["平台对应 Agents (处理会话与指令)"]
    end

    %% 中间处理层
    subgraph Middleware ["🔐 核心中间层"]
        Logic["加密、签名与自动重试机制"]
    end

    %% 实时消息总线 (完全独立)
    subgraph RealTime ["⚡ 实时消息层 (Hot Path)"]
        MQTT(("MQTT / 消息队列"))
    end

    %% 远程同步存储 (完全独立)
    subgraph Persistence ["☁️ 远程存储层 (Cold Path)"]
        WebDAV[("WebDAV / 远程空间")]
    end

    %% 逻辑连线
    Platforms <--> A_Group
    A_Group --> Logic
    Dashboards <--> Logic

    %% 路径 1: 实时数据流
    Logic <-->|实时价格/条件单/网格指令| MQTT

    %% 路径 2: 状态同步流
    A_Group -.->|每日持仓/订单状态同步| WebDAV
    Dashboards -.->|读取持久化配置与历史| WebDAV

    %% 样式定义
    style MQTT fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style WebDAV fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style Logic fill:#fff4dd,stroke:#d4a017,stroke-dasharray: 5 5
```

```mermaid
graph TD
    %% User Interface Layer
    subgraph UI ["💻 User Interface & Dashboards"]
        direction LR
        Platforms["🌐 Web Trading Platforms (A/B/C)"]
        Dashboards["📊 Multiple Dashboards"]
    end

    %% Agent Layer
    subgraph Agents ["🤖 Agent Layer"]
        A_Group["Platform Agents (Session & CMD)"]
    end

    %% Processing Layer
    subgraph Middleware ["🔐 Middleware Layer"]
        Logic["Encryption, Signing & Retry Logic"]
    end

    %% Real-time Messaging (Independent)
    subgraph RealTime ["⚡ Real-time Messaging (Hot Path)"]
        MQTT(("MQTT / Message Broker"))
    end

    %% Remote Storage (Independent)
    subgraph Persistence ["☁️ Remote Storage (Cold Path)"]
        WebDAV[("WebDAV / Remote Storage")]
    end

    %% Connections
    Platforms <--> A_Group
    A_Group --> Logic
    Dashboards <--> Logic

    %% Path 1: High-frequency Data
    Logic <-->|Live Price / Condition / Grid| MQTT

    %% Path 2: Low-frequency Sync
    A_Group -.->|Sync Positions & Order States| WebDAV
    Dashboards -.->|Load History & Config| WebDAV

    %% Styling
    style MQTT fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style WebDAV fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style Logic fill:#fff4dd,stroke:#d4a017,stroke-dasharray: 5 5
```
