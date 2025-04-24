import torch
import torch.nn as nn
from typing import Tuple

class GlucoseLSTM(nn.Module):
    """
    LSTM model for glucose prediction.
    
    Takes time-series glucose readings and static patient features to predict
    future glucose values.
    
    Attributes:
        seq_len: Length of input sequence (default: 36 readings)
        hidden_size: Size of LSTM hidden state (default: 64)
        num_layers: Number of LSTM layers (default: 2)
        static_input_size: Number of static features (default: 5)
        pred_len: Number of future readings to predict (default: 6)
    """
    def __init__(self, seq_len: int = 36, hidden_size: int = 64, 
                 num_layers: int = 2, static_input_size: int = 5, 
                 pred_len: int = 6):
        super(GlucoseLSTM, self).__init__()
        self.lstm = nn.LSTM(
            input_size=1, 
            hidden_size=hidden_size, 
            num_layers=num_layers, 
            batch_first=True
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size + static_input_size, 64),
            nn.ReLU(),
            nn.Dropout(0.2),  # Add dropout for better generalization
            nn.Linear(64, pred_len)
        )

    def forward(self, x_seq: torch.Tensor, x_static: torch.Tensor) -> torch.Tensor:
        """
        Forward pass of the model.
        
        Args:
            x_seq: Tensor of shape (batch_size, seq_len, 1) containing glucose readings
            x_static: Tensor of shape (batch_size, static_input_size) containing static features
            
        Returns:
            Tensor of shape (batch_size, pred_len) containing predicted glucose values
        """
        _, (h_n, _) = self.lstm(x_seq)
        h_last = h_n[-1]
        x_combined = torch.cat((h_last, x_static), dim=1)
        return self.fc(x_combined)