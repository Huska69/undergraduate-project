from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, conlist, Field
import torch
import numpy as np
import logging
from typing import List, Dict, Any, Optional
from glucose_model import GlucoseLSTM
import os
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Glucose Prediction API",
    description="API for predicting future glucose values based on historical readings",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify in production to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model path from environment variable or default
MODEL_PATH = os.environ.get("MODEL_PATH", "glucose_lstm.pth")

# Load model on startup
model = None

def get_model():
    global model
    if model is None:
        try:
            model = GlucoseLSTM()
            model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
            model.eval()
            logger.info(f"Model loaded successfully from {MODEL_PATH}")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise RuntimeError(f"Failed to load model: {str(e)}")
    return model

class PredictRequest(BaseModel):
    x_seq: conlist(float, min_items=36, max_items=36) = Field(
        ..., description="36 historical glucose readings"
    )
    x_static: conlist(float, min_items=5, max_items=5) = Field(
        ..., description="5 static patient features"
    )
    user_id: str = Field(..., description="User identifier")

class PredictionResponse(BaseModel):
    user_id: str
    prediction: List[float]
    timestamp: float
    input_summary: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: float

@app.post("/predict", response_model=PredictionResponse)
def predict(data: PredictRequest, model=Depends(get_model)):
    """
    Generate glucose predictions based on historical data
    
    Args:
        data: Request containing historical glucose values and static features
        
    Returns:
        Predicted glucose values for the next time steps
    """
    start_time = time.time()
    
    try:
        # Input validation (additional checks beyond Pydantic)
        if any(not np.isfinite(x) for x in data.x_seq):
            raise HTTPException(status_code=400, detail="Input sequence contains invalid values")
            
        if any(not np.isfinite(x) for x in data.x_static):
            raise HTTPException(status_code=400, detail="Static features contain invalid values")
        
        # Prepare tensors
        x_seq = torch.tensor(data.x_seq, dtype=torch.float32).unsqueeze(0).unsqueeze(-1)
        x_static = torch.tensor(data.x_static, dtype=torch.float32).unsqueeze(0)
        
        # Generate prediction
        with torch.no_grad():
            prediction = model(x_seq, x_static).squeeze().tolist()
        
        # Calculate summary statistics
        input_summary = {
            "sequence_mean": np.mean(data.x_seq),
            "sequence_std": np.std(data.x_seq),
            "sequence_min": min(data.x_seq),
            "sequence_max": max(data.x_seq),
            "processing_time_ms": round((time.time() - start_time) * 1000, 2)
        }
        
        # Log prediction metrics
        logger.info(f"Generated prediction for user {data.user_id} in {input_summary['processing_time_ms']}ms")
        
        return {
            "user_id": data.user_id,
            "prediction": prediction,
            "timestamp": time.time(),
            "input_summary": input_summary
        }
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/health", response_model=HealthResponse)
def health():
    """
    Health check endpoint
    
    Returns:
        API status information
    """
    try:
        # Verify model can be loaded
        model = get_model()
        return {
            "status": "ok",
            "version": "1.0.0",
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "error",
            "version": "1.0.0",
            "timestamp": time.time()
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)