package in.sampark.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.sampark.app.models.ChatMessage
import in.sampark.app.models.ConversationItem
import in.sampark.app.models.MessageType
import in.sampark.app.ui.components.QuotationCard
import in.sampark.app.ui.screens.MainAppScaffold
import in.sampark.app.ui.theme.Emerald800
import in.sampark.app.ui.theme.SamparkTheme
import in.sampark.app.viewmodels.MainViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SamparkTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    SamparkNativeApp(viewModel)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SamparkNativeApp(viewModel: MainViewModel) {
    val activeChatMessages by viewModel.activeChatMessages.collectAsState()
    var activeConversation by remember { mutableStateOf<ConversationItem?>(null) }

    if (activeConversation != null) {
        val conv = activeConversation!!
        var messageInput by remember { mutableStateOf("") }
        var showQuoteDialog by remember { mutableStateOf(false) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text(conv.name, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
                            Text(if (conv.isBusiness) "Verified Business · Online" else "Contact", fontSize = 11.sp, color = Color(0xFFD1FAE5))
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { activeConversation = null }) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Emerald800),
                    actions = {
                        IconButton(onClick = { showQuoteDialog = true }) {
                            Icon(Icons.Default.Receipt, contentDescription = "Create Quotation", tint = Color.White)
                        }
                    }
                )
            },
            bottomBar = {
                Surface(
                    color = Color.White,
                    tonalElevation = 4.dp,
                    modifier = Modifier.fillMaxWidth().imePadding()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = messageInput,
                            onValueChange = { messageInput = it },
                            placeholder = { Text("Type a message or price inquiry...", fontSize = 13.sp) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(24.dp),
                            maxLines = 3
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        IconButton(
                            onClick = {
                                if (messageInput.isNotBlank()) {
                                    viewModel.sendMessage(conv.id, messageInput.trim())
                                    messageInput = ""
                                }
                            }
                        ) {
                            Icon(Icons.Default.Send, contentDescription = "Send", tint = Emerald800)
                        }
                    }
                }
            }
        ) { padding ->
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(activeChatMessages) { msg ->
                    ChatBubble(msg = msg, isFromMe = msg.isFromMe)
                }
            }

            if (showQuoteDialog) {
                QuotationDialog(
                    onDismiss = { showQuoteDialog = false },
                    onCreate = { item, qty, price ->
                        viewModel.createQuotation(conv.id, item, qty, price)
                        showQuoteDialog = false
                    }
                )
            }
        }
    } else {
        MainAppScaffold(
            viewModel = viewModel,
            onOpenChat = { conv -> activeConversation = conv },
            onOpenBusiness = { bizId ->
                val conv = viewModel.conversations.value.find { it.participantId == bizId }
                if (conv != null) activeConversation = conv
            }
        )
    }
}

@Composable
fun ChatBubble(msg: ChatMessage, isFromMe: Boolean) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isFromMe) Alignment.End else Alignment.Start
    ) {
        if (msg.quotation != null) {
            QuotationCard(
                quotation = msg.quotation,
                isFromMe = isFromMe,
                modifier = Modifier.widthIn(max = 300.dp)
            )
        } else {
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (isFromMe) Color(0xFFDCF8C6) else Color.White
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.widthIn(max = 280.dp)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text(text = msg.text, fontSize = 13.sp, color = Color(0xFF1E293B))
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(text = msg.formattedTime, fontSize = 10.sp, color = Color.Gray, modifier = Modifier.align(Alignment.End))
                }
            }
        }
    }
}

@Composable
fun QuotationDialog(
    onDismiss: () -> Unit,
    onCreate: (itemName: String, quantity: Int, unitPrice: Double) -> Unit
) {
    var item by remember { mutableStateOf("Custom Teak Wooden Dining Set") }
    var quantity by remember { mutableStateOf("1") }
    var price by remember { mutableStateOf("28500") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Generate Official Quotation", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = item, onValueChange = { item = it }, label = { Text("Item Name") })
                OutlinedTextField(value = quantity, onValueChange = { quantity = it }, label = { Text("Quantity") })
                OutlinedTextField(value = price, onValueChange = { price = it }, label = { Text("Unit Price (₹)") })
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val qty = quantity.toIntOrNull() ?: 1
                    val p = price.toDoubleOrNull() ?: 0.0
                    onCreate(item, qty, p)
                },
                colors = ButtonDefaults.buttonColors(containerColor = Emerald800)
            ) {
                Text("Issue Quotation")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
