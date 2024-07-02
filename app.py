from flask import Flask, render_template, request, jsonify
from googleapiclient.discovery import build
import re
import pandas as pd
import joblib
from collections import Counter
from nltk.corpus import stopwords
import plotly.express as px
from wordcloud import WordCloud
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import base64
from io import BytesIO

app = Flask(__name__)

# Ganti dengan API Key Anda
API_KEY = 'AIzaSyB5jCeE1XAuNODzWR6noKVreKw0yYxyxP4'
YOUTUBE_API_SERVICE_NAME = 'youtube'
YOUTUBE_API_VERSION = 'v3'

# Load the sentiment analysis model
model = joblib.load('models/nb_model.pkl')

def get_video_id(url):
    video_id = None
    regex = re.compile(r'(?<=v=)[^&#]+|(?<=be/)[^&#]+')
    match = regex.search(url)
    if match:
        video_id = match.group()
    return video_id

def get_video_comments(video_id, max_results=100):
    youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=API_KEY)
    comments = []
    request = youtube.commentThreads().list(
        part="snippet",
        videoId=video_id,
        maxResults=max_results,
        textFormat="plainText"
    )
    while request:
        response = request.execute()
        for item in response['items']:
            comment = item['snippet']['topLevelComment']['snippet']
            comments.append({
                'author': comment['authorDisplayName'],
                'published_at': comment['publishedAt'],
                'like_count': comment['likeCount'],
                'text': comment['textOriginal'],
                'author_profile_image_url': comment['authorProfileImageUrl'],
                'author_channel_url': comment['authorChannelUrl']
            })
        if 'nextPageToken' in response:
            request = youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=max_results,
                pageToken=response['nextPageToken'],
                textFormat="plainText"
            )
        else:
            break
    return comments

def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\@\w+|\#', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    return text

def predict_sentiment(comments):
    texts = [preprocess_text(comment['text']) for comment in comments]
    sentiments = model.predict(texts)
    sentiment_scores = model.predict_proba(texts)

    for comment, sentiment, score in zip(comments, sentiments, sentiment_scores):
        comment['sentiment'] = sentiment
        comment['sentiment_score'] = round(max(score), 2)  # Rounding to 2 decimal places
    return comments

@app.route('/', methods=['GET', 'POST'])
def index():
    video_id = None
    comments = []
    sentiment_comments = []
    url = ""  # Initialize url here

    if request.method == 'POST':
        url = request.form['video_url']
        video_id = get_video_id(url)
        if video_id:
            comments = get_video_comments(video_id)
            if 'analyze' in request.form:
                sentiment_comments = predict_sentiment(comments)

    sentiment_distribution = []
    if sentiment_comments:
        df_sentiment = pd.DataFrame(sentiment_comments)
        sentiment_counts = df_sentiment['sentiment'].value_counts().reset_index()
        sentiment_counts.columns = ['sentiment', 'count']
        sentiment_distribution = sentiment_counts.to_dict(orient='records')

    return render_template('index.html', video_id=video_id, video_url=url, comments=comments, sentiment_comments=sentiment_comments)

@app.route('/sentiment-distribution')
def sentiment_distribution():
    video_id = request.args.get('video_id')
    if not video_id:
        return jsonify([])

    comments = get_video_comments(video_id)
    sentiment_comments = predict_sentiment(comments)

    df_sentiment = pd.DataFrame(sentiment_comments)
    sentiment_counts = df_sentiment['sentiment'].value_counts().reset_index()
    sentiment_counts.columns = ['sentiment', 'count']

    return jsonify(sentiment_counts.to_dict(orient='records'))

@app.route('/data-training-label')
def data_training_label():
    # Path to your CSV file
    csv_file = 'dataset/labelingmanual.csv'
    
    # Read the CSV file into a DataFrame
    df = pd.read_csv(csv_file)
    
    # Convert DataFrame to JSON
    data = df.to_dict(orient='records')
    
    # Get the column names
    columns = df.columns.tolist()
    
    # Render the template with the data
    return render_template('data_training_label.html', data=data, columns=columns)

stop_words = set(stopwords.words('indonesian'))

def get_top_words(df, sentiment_label, n=10):
    text = " ".join(review for review in df[df['sentiment'] == sentiment_label]['text'])
    words = [word for word in text.split() if word not in stop_words]
    word_counts = Counter(words)
    top_words = word_counts.most_common(n)
    return pd.DataFrame(top_words, columns=['word', 'frequency'])

@app.route('/top-words')
def top_words():
    video_id = request.args.get('video_id')
    sentiment_label = request.args.get('sentiment_label', 'positive')
    if not video_id:
        return jsonify([])

    comments = get_video_comments(video_id)
    sentiment_comments = predict_sentiment(comments)

    df_sentiment = pd.DataFrame(sentiment_comments)
    top_words_df = get_top_words(df_sentiment, sentiment_label)
    
    return jsonify(top_words_df.to_dict(orient='records'))

def get_text_by_sentiment(df, sentiment_label):
    filtered_df = df[df['sentiment'] == sentiment_label]
    if filtered_df.empty:
        print(f"Tidak ada komentar dengan label '{sentiment_label}'.")
        return ""
    return " ".join(review for review in filtered_df['text'])

@app.route('/wordcloud')
def wordcloud():
    video_id = request.args.get('video_id')
    sentiment_label = request.args.get('sentiment_label', 'positive')
    if not video_id:
        return jsonify([])

    comments = get_video_comments(video_id)
    sentiment_comments = predict_sentiment(comments)
    df_sentiment = pd.DataFrame(sentiment_comments)

    text = get_text_by_sentiment(df_sentiment, sentiment_label)
    if not text:
        return jsonify({"error": "No comments found for the given sentiment label."})

    wordcloud = WordCloud(width=800, height=400, background_color='white', stopwords=stop_words, collocations=False).generate(text)

    img = BytesIO()
    wordcloud.to_image().save(img, format='PNG')
    img.seek(0)

    return jsonify({"image": base64.b64encode(img.getvalue()).decode()})

@app.route('/top-comments')
def top_comments():
    video_id = request.args.get('video_id')
    sentiment_label = request.args.get('sentiment_label', 'positive')
    if not video_id:
        return jsonify([])

    comments = get_video_comments(video_id)
    sentiment_comments = predict_sentiment(comments)
    df_sentiment = pd.DataFrame(sentiment_comments)

    top_like_comments = df_sentiment[df_sentiment['sentiment'] == sentiment_label].sort_values(by='like_count', ascending=False).head(5)

    top_comments_list = top_like_comments.to_dict(orient='records')

    return jsonify(top_comments_list)

if __name__ == '__main__':
    app.run(debug=True)
