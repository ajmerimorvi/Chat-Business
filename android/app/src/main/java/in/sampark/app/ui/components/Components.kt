package in.sampark.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.sampark.app.models.BusinessVerification
import in.sampark.app.models.QuotationData
import in.sampark.app.models.QuotationStatus
import in.sampark.app.models.VerificationLevel
import in.sampark.app.ui.theme.Emerald50
import in.sampark.app.ui.theme.Emerald700
import in.sampark.app.ui.theme.Emerald800

@Composable
fun UniversalSearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    onClear: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp),
        shape = RoundedCornerShape(12.dp),
        color = Color(0xFFF3F4F6)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = "Search",
                tint = Color.Gray,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            TextField(
                value = query,
                onValueChange = onQueryChange,
                placeholder = {
                    Text(
                        "Search chats, people, businesses, products...",
                        fontSize = 13.sp,
                        color = Color.Gray
                    )
                },
                singleLine = true,
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent
                ),
                modifier = Modifier.weight(1f)
            )
            if (query.isNotEmpty()) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Clear",
                    tint = Color.Gray,
                    modifier = Modifier
                        .size(18.dp)
                        .clickable { onClear() }
                )
            }
        }
    }
}

@Composable
fun VerificationBadges(
    verification: BusinessVerification?,
    modifier: Modifier = Modifier
) {
    if (verification == null || verification.level == VerificationLevel.UNVERIFIED) return

    Row(modifier = modifier, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        if (verification.isMobileVerified) {
            BadgeTag(text = "🟢 Mobile", bgColor = Color(0xFFECFDF5), textColor = Color(0xFF047857))
        }
        if (verification.isLocationVerified) {
            BadgeTag(text = "📍 Location", bgColor = Color(0xFFEFF6FF), textColor = Color(0xFF1D4ED8))
        }
        if (verification.isBusinessDocVerified) {
            BadgeTag(text = "🏢 Legal Verified", bgColor = Color(0xFFFAF5FF), textColor = Color(0xFF7E22CE))
        }
    }
}

@Composable
fun BadgeTag(text: String, bgColor: Color, textColor: Color) {
    Box(
        modifier = Modifier
            .background(bgColor, RoundedCornerShape(4.dp))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(text = text, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = textColor)
    }
}

@Composable
fun QuotationCard(
    quotation: QuotationData,
    isFromMe: Boolean,
    onAccept: () -> Unit = {},
    onRequestRevision: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(Emerald700))
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "QUOTATION ${quotation.quotationNumber}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = Emerald800
                )
                Text(
                    text = quotation.status.name,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = when (quotation.status) {
                        QuotationStatus.ACCEPTED -> Color(0xFF047857)
                        QuotationStatus.REJECTED -> Color(0xFFDC2626)
                        else -> Emerald700
                    }
                )
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(text = quotation.itemName, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text(text = "Quantity: ${quotation.quantity} × ₹${quotation.unitPrice.toInt()}", fontSize = 12.sp, color = Color.Gray)
            Text(text = "GST (${quotation.gstRatePct}%): Included in Total", fontSize = 11.sp, color = Color.Gray)

            Divider(modifier = Modifier.padding(vertical = 6.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Total Payable:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Text("₹${quotation.totalAmount.toInt()}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Emerald800)
            }

            if (!isFromMe && quotation.status == QuotationStatus.SENT) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onRequestRevision,
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(vertical = 4.dp)
                    ) {
                        Text("Negotiate", fontSize = 11.sp)
                    }
                    Button(
                        onClick = onAccept,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald800),
                        contentPadding = PaddingValues(vertical = 4.dp)
                    ) {
                        Text("Accept Quote", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}
